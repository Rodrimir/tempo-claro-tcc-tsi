package com.rodrigo.backend2java.biblioteca;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import java.util.UUID;
import lombok.Builder;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "biblioteca_textos")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class BibliotecaTexto {

    @Id
    @Column(name = "bib_id")
    private UUID id;

    @Column(name = "bib_categoria")
    private String categoria;

    @Builder.Default
    @Column(name = "bib_idioma")
    private String idioma = "pt-BR";

    @Column(name = "bib_texto_pre_tarefa")
    private String textoPreTarefa;

    @Column(name = "bib_texto_sucesso_padrao")
    private String textoSucessoPadrao;

    @Column(name = "bib_texto_sucesso_extra")
    private String textoSucessoExtra;

    @Column(name = "bib_texto_aviso_urgencia")
    private String textoAvisoUrgencia;
}
