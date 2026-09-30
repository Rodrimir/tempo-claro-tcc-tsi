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

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
