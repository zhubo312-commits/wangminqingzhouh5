FROM maven:3.9.11-eclipse-temurin-17 AS build

WORKDIR /workspace/services/paipan
COPY services/paipan/pom.xml ./
RUN mvn -q dependency:go-offline
COPY services/paipan/src ./src
COPY docs/xingxiang-golden /workspace/docs/xingxiang-golden
RUN mvn -q verify

FROM eclipse-temurin:17-jre-jammy AS runtime

ARG RELEASE_REVISION=local
LABEL org.opencontainers.image.revision=${RELEASE_REVISION}

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/* \
  && useradd --system --uid 10001 --create-home paipan

WORKDIR /app
COPY --from=build --chown=paipan:paipan /workspace/services/paipan/target/paipan-service-1.0.0.jar ./paipan-service.jar

USER paipan
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "/app/paipan-service.jar"]
