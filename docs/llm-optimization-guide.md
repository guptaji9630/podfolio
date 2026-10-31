# LLM usage optimization

Generic requests use a bounded in-memory cache of up to 1000 entries with a 24-hour TTL. Exact matches avoid both completion and embedding calls. For nonidentical questions, the backend can compare embeddings at cosine similarity >= 0.85. Set `NVIDIA_EMBEDDING_MODEL` to an embedding model available to your NIM account. Embedding requests time out after 2.5 seconds; if they fail, chat continues with exact caching. No model download is required at startup.

Cache scope includes the server prompt, completion model, optional conversation ID, and complete preceding conversation context. A question after different preceding messages deliberately misses. Consequently, a 50% hit rate depends on the workload; it is not guaranteed for changing conversations. Similarity can still match questions with different meaning, so use `options.useCache:false` for requests needing fresh or exact contextual answers.

Identical in-flight generic requests share one completion call. Stable hashing includes nested message content and message order. Each caller has its own cancellation subscription. Cancelling one caller leaves the others active; cancelling the final subscriber aborts upstream work. Failures and completed requests release ownership and cancellation listeners.

Tool executions, email actions, failures and drawing results bypass answer caching and request coalescing. They are not automatically retried. `useTools:false` disables tool execution. `useCache:false` also disables generic request coalescing. Service restarts clear all cache data.

Authenticated `GET /api/mcp/cache/stats` returns size, capacity, hits and misses without logging visitor questions or conversation content. Use stub-provider regression tests to verify completion counts. Live provider latency and representative visitor hit rates require separate measurement.
