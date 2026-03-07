import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/chat(.*)", "/users(.*)"]);

export default clerkMiddleware((auth, req) => {
    // Let Clerk safely process internal handshakes without edge exceptions
    if (req.nextUrl.searchParams.has('__clerk_handshake')) {
        return;
    }

    if (isProtectedRoute(req)) {
        const { userId } = auth();
        if (!userId) {
            return auth().redirectToSignIn();
        }
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
