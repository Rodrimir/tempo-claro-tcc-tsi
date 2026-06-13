# Estágio de build
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app

# Copia os arquivos do Gradle e o código fonte
COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .
COPY src src

# Dá permissão de execução ao gradlew e faz o build (sem rodar os testes para ir mais rápido)
RUN chmod +x ./gradlew
RUN ./gradlew build -x test

# Estágio de execução
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copia o JAR compilado do estágio anterior
COPY --from=build /app/build/libs/*.jar app.jar

# Define o profile de produção
ENV SPRING_PROFILES_ACTIVE=prod

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
