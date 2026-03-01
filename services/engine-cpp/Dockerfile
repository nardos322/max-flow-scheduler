FROM gcc:14 AS builder
WORKDIR /src

COPY services/engine-cpp ./services/engine-cpp

RUN cmake -S services/engine-cpp -B services/engine-cpp/build -DCMAKE_BUILD_TYPE=Release -DBUILD_TESTING=OFF \
  && cmake --build services/engine-cpp/build --target scheduler_engine -j

FROM debian:bookworm-slim
WORKDIR /app

COPY --from=builder /src/services/engine-cpp/build/scheduler_engine /usr/local/bin/scheduler_engine

ENTRYPOINT ["/usr/local/bin/scheduler_engine"]
