package com.rodrigo.backend2java.verificacao;
import java.util.UUID;
import java.time.OffsetDateTime;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.Setter;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "codigos_verificacao")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class CodigoVerificacao {

    @Id
    @Column(name = "cod_id")
    private UUID id;

    @Column(name = "cod_email")
    private String email;

    @Column(name = "cod_codigo_hash")
    private String codigoHash;

    @Column(name = "cod_tipo")
    private String tipo;

    @Column(name = "cod_expira_em")
    private OffsetDateTime expiraEm;

    @Builder.Default
    @Column(name = "cod_tentativas")
    private Short tentativas = 0;

    @Column(name = "cod_usado_em")
    private OffsetDateTime usadoEm;

    @Builder.Default
    @Column(name = "cod_criado_em")
    private OffsetDateTime criadoEm = OffsetDateTime.now();
}
