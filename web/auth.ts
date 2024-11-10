import NextAuth from "next-auth";
import authConfig from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
    debug: true,
    session: { strategy: "jwt" },


    callbacks: {
        authorized({ auth }) {
            console.log("inside authorized callback", auth);

            return true;
        },
        jwt: ({ token, user }) => {
            console.log("inside jwt callback", token, user);
            if (user) {
                const u = user as unknown as any;
                return {
                    ...token,
                    id: u.id,
                    randomKey: u.randomKey,
                };
            }
            return token;
        },
        session(params) {
            console.log("inside session callback", params);
            return {
                ...params.session,
                user: {
                    ...params.session.user,
                    id: params.token.id as string,
                    randomKey: params.token.randomKey,
                },
            };
        },
    },
    ...authConfig
});