FROM maven:3.9-amazoncorretto-17 AS build
WORKDIR /build

COPY pom.xml .
RUN mvn -B dependency:go-offline

COPY src ./src
RUN mvn -B package -DskipTests

FROM amazoncorretto:17-alpine
WORKDIR /app

COPY --from=build /build/target/tempo-claro-1.0.jar /app/app.jar

ENV SPRING_PROFILES_ACTIVE=prod
# Render gratuito: 512 MB e CPU fracionada. Heap proporcional ao contêiner, coletor serial e
# compilação só em C1 reduzem memória e o tempo de subida depois de a instância dormir.
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=65 -XX:+UseSerialGC -XX:TieredStopAtLevel=1 -Xss512k"

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
