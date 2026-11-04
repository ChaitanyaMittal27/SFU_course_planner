# syntax=docker/dockerfile:1

# dev stage
FROM eclipse-temurin:17-jdk-jammy AS dev
WORKDIR /workspace
COPY gradlew gradlew
COPY gradle gradle
COPY build.gradle settings.gradle ./
RUN sed -i 's/\r$//' gradlew && chmod +x gradlew && ./gradlew --no-daemon dependencies
COPY src src
EXPOSE 5000
CMD ["./gradlew", "--no-daemon", "bootRun"]

# test stage
FROM dev AS test
RUN ./gradlew --no-daemon test

# builder stage
FROM eclipse-temurin:17-jdk-jammy AS builder
WORKDIR /workspace
COPY gradlew gradlew
COPY gradle gradle
COPY build.gradle settings.gradle ./
RUN sed -i 's/\r$//' gradlew && chmod +x gradlew
COPY src src
RUN ./gradlew --no-daemon bootJar

# runtime stage
FROM eclipse-temurin:17-jre-jammy AS runtime
WORKDIR /app
ENV SERVER_PORT=5000
COPY --from=builder /workspace/build/libs/*.jar app.jar
EXPOSE 5000
ENTRYPOINT ["java", "-jar", "/app/app.jar"]

# production stage (for later)
FROM runtime AS prod