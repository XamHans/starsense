import logging
import os
from typing import Dict, List

import psycopg2
from dotenv import load_dotenv
from psycopg2.extras import execute_values

# Load environment variables
load_dotenv()

# Get the database connection URL from the environment variable
DB_CONNECTION = os.getenv("DB_CONNECTION")

def get_db_connection():
    """
    Creates and returns a connection to the PostgreSQL database.
    """
    return psycopg2.connect(DB_CONNECTION)

def store_repository(github_username: str, repo_info: Dict):
    """
    Stores repository information, README chunks, and their embeddings in the vector database.
    First checks if repository already exists to avoid duplicates.
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # Check if repository already exists
            cur.execute("""
                SELECT id FROM repositories 
                WHERE full_name = %s
            """, (repo_info['full_name'],))
            
            existing_repo = cur.fetchone()
            
            if existing_repo:
                logging.info(f"Repository {repo_info['full_name']} already exists, skipping insertion")
                return existing_repo[0]
            
            # Insert repository information if it doesn't exist
            cur.execute("""
                INSERT INTO repositories (github_username, name, full_name, readme, description, url, language, stars)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (github_username, repo_info['name'], repo_info['full_name'], repo_info['readme'], repo_info['description'],
                  repo_info['url'], repo_info['language'], repo_info['stars']))
            repo_id = cur.fetchone()[0]
 
        conn.commit()
        return repo_id
    except Exception as e:
        conn.rollback()
        raise Exception(f"Error storing repository and embeddings: {str(e)}")
    finally:
        conn.close()

def search_for_repos(query: str, limit: int = 5):
    """
    Perform semantic search to find relevant repositories.
    Returns repository information along with similarity scores.
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            logging.info("Executing semantic search query")
            # Modified query to return repository metadata along with similarity scores
            cur.execute("""
                WITH ranked_results AS (
                    SELECT 
                        r.id,
                        r.name,
                        r.full_name,
                        r.description,
                        r.url,
                        res.chunk,
                        res.distance
                    FROM (
                        SELECT 
                            id,
                            chunk,
                            embedding <=> ai.openai_embed('text-embedding-3-small', %s) as distance
                        FROM "public"."repositories_embedding_store"
                        ORDER BY distance
                        LIMIT %s
                    ) res
                    JOIN repositories r ON r.id = res.id
                )
                SELECT 
                    CONCAT('name: ', name, ' url: ', url, ' content: ', description) as combined_text,
                    1 - distance as similarity_score
                FROM ranked_results
                ORDER BY similarity_score DESC
            """, (query, limit))
            
            results = cur.fetchall()
            logging.info(f"Search query returned {len(results)} results")
            return results
    finally:
        conn.close()
