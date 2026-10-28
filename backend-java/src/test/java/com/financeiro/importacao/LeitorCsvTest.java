package com.financeiro.importacao;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class LeitorCsvTest {
    @Test
    void leBomSeparadorBrasileiroAspasEscapadasEQuebraNaCelula() {
        var linhas = LeitorCsv.ler("\uFEFFData;Descrição;Valor\r\n29/02/2028;\"Texto; \"\"fictício\"\"\ncontinua\";1.234,56\r\n");
        assertThat(linhas).hasSize(1);
        assertThat(linhas.get(0).numero()).isEqualTo(2);
        assertThat(linhas.get(0).valores().get("descricao")).isEqualTo("Texto; \"fictício\"\ncontinua");
        assertThat(linhas.get(0).valores().get("valor")).isEqualTo("1.234,56");
    }

    @Test
    void leVirgulasESemNovaLinhaFinal() {
        assertThat(LeitorCsv.ler("date,amount,title\n2026-01-01,0.10,Fictício")).hasSize(1);
    }

    @Test
    void ignoraSeparadoresDentroDasAspasDoCabecalho() {
        var linhas = LeitorCsv.ler("\"Texto, com, vírgulas\";Data;Valor\nFictício;2026-01-01;0,10");
        assertThat(linhas.get(0).valores().get("data")).isEqualTo("2026-01-01");
    }

    @ParameterizedTest
    @ValueSource(strings = {"data,valor\n\"aberto,1", "data,data\n1,2", "data,valor\n1,2,3", "data,valor\n\"x\"z,1"})
    void rejeitaEstruturaAmbigua(String texto) {
        assertThatThrownBy(() -> LeitorCsv.ler(texto)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void aceitaSomenteCabecalhoSemCriarLinhaFantasma() {
        assertThat(LeitorCsv.ler("data,valor\n")).isEmpty();
    }

    @Test
    void validaDinheiroSemTruncarCasasBrasileiras() {
        assertThat(CsvService.valor("R$ 1.234,56")).isEqualByComparingTo("1234.56");
        assertThat(CsvService.valor("-0.20")).isEqualByComparingTo("-0.20");
        assertThatThrownBy(() -> CsvService.valor("1.234")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> CsvService.valor("1,001")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> CsvService.valor("12abc")).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void validaDatasReaisEFevBissexto() {
        assertThat(CsvService.data("29/02/2028")).hasToString("2028-02-29");
        assertThat(CsvService.data("2026-12-31T00:00:00Z")).hasToString("2026-12-31");
        assertThatThrownBy(() -> CsvService.data("29/02/2027")).isInstanceOf(RuntimeException.class);
        assertThatThrownBy(() -> CsvService.data("2026-02-30")).isInstanceOf(RuntimeException.class);
    }

    @ParameterizedTest
    @ValueSource(strings = {"1 2", "1R$2", "R$R$12", "1\u00A02"})
    void rejeitaSimboloOuEspacoNoMeioDoValor(String valor) {
        assertThatThrownBy(() -> CsvService.valor(valor)).isInstanceOf(IllegalArgumentException.class);
    }

    @ParameterizedTest
    @ValueSource(strings = {"2026-12-31lixo", "2026-12-31T99:99Z"})
    void rejeitaSufixoOuHorarioInvalido(String data) {
        assertThatThrownBy(() -> CsvService.data(data)).isInstanceOf(RuntimeException.class);
    }

    @Test
    void ignoraLinhasIniciaisVaziasEPreservaNumeroFisico() {
        var linhas = LeitorCsv.ler("\n\r\nData;Valor\n2026-01-01;0,10");
        assertThat(linhas).hasSize(1);
        assertThat(linhas.get(0).numero()).isEqualTo(4);
    }

    @Test
    void limitaLinhasAntesDeContinuarLeitura() {
        assertThatThrownBy(() -> LeitorCsv.ler("data,valor\n" + "2026-01-01,1\n".repeat(1001)))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("1000 linhas");
    }
}
