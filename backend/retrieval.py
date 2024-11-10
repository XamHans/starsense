import logging
from typing import List, Tuple

from db import search_for_repos
from provider import AIProvider, ChatMessage, initialize_ai_provider
from termcolor import colored


def log_step(step: str, message: str):
    """Log a step in the process with a colorized output."""
    logging.info(f"{colored(step, 'blue', attrs=['bold'])}: {message}")

def format_repo_context(repos: List[Tuple], query: str) -> str:
    """Format repository information into a structured markdown context."""
    # Start with a header section
    context = [f"# Your Starred Repositories Related to \"{query}\""]
    
    for repo in repos:
        # The repo tuple contains (combined_text, similarity_score)
        combined_text, score = repo
        
        try:
            # Split only on the first occurrence of each keyword
            name_part = combined_text.split('name:', 1)[1].split('url:', 1)[0].strip()
            url_part = combined_text.split('url:', 1)[1].split('content:', 1)[0].strip()
            content_part = combined_text.split('content:', 1)[1].strip()
            
            # Format as markdown with repository link and relevance score
            # Keep everything on one line for cleaner presentation
            context.append(f"[{name_part}]({url_part}) - {content_part} *Relevance: {score*100:.1f}%*")
            
        except IndexError:
            logging.warning(f"Malformed repository entry: {combined_text}")
    
    # Add a note about relevance scores at the bottom
    if context:
        context.append("\nNote: The relevance scores are based on the similarity of the repository names and descriptions to the query.")
            
    return "\n".join(context)

async def generate_response(query: str, format_only: bool = False) -> str:
    """
    Generate a response for the user's query.
    If format_only is True, returns just the formatted repository list.
    Otherwise, provides an AI-enhanced analysis of the repositories.
    """
    log_step("RESPONSE", "Generating response based on similar repositories")
    similar_repos = search_for_repos(query)
    provider = initialize_ai_provider()
    # Format the repository context with the query
    repo_context = format_repo_context(similar_repos, query)
    
    # If format_only is True, return just the formatted repository list
    if format_only:
        return repo_context
    
    # Create a comprehensive RAG prompt for AI analysis
    system_prompt = """You are a technical assistant specializing in analyzing GitHub repositories.
Provide concise, structured responses that:
1. Focus on how each repository specifically addresses the user's query
2. Highlight key technical features and capabilities
3. Keep explanations brief and to the point
4. Use markdown formatting appropriately"""

    user_prompt = f"""Based on the following repository information, provide a structured response that helps the user understand the most relevant repositories for their query.

{repo_context}

Focus on concrete technical details rather than general statements."""

    messages = [
        ChatMessage(role="system", content=system_prompt),
        ChatMessage(role="user", content=user_prompt)
    ]
    
    response = await provider.chat_completion(
        messages=messages,
        max_tokens=1000,  # Reduced for more concise responses
        temperature=0.1   # Keep low for factual responses
    )

    logging.info(f"Generated response: {response}")
    
    return response
