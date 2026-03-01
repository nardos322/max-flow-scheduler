FROM gcc:14 AS engine-builder
WORKDIR /build

COPY services/engine-cpp ./services/engine-cpp

RUN cmake -S services/engine-cpp -B services/engine-cpp/build -DCMAKE_BUILD_TYPE=Release -DBUILD_TESTING=OFF \
  && cmake --build services/engine-cpp/build --target scheduler_engine -j

FROM node:22-bookworm-slim AS api-runtime
WORKDIR /workspace

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/domain ./packages/domain
COPY apps/api ./apps/api

RUN pnpm install --frozen-lockfile=false --filter @scheduler/api...
RUN DATABASE_URL=file:./apps/api/.data/dev.db pnpm --filter @scheduler/api run db:generate

COPY --from=engine-builder /build/services/engine-cpp/build/scheduler_engine /workspace/services/engine-cpp/build/scheduler_engine

WORKDIR /workspace/apps/api

ENV PORT=3000
EXPOSE 3000

CMD ["pnpm", "exec", "tsx", "src/index.ts"]
