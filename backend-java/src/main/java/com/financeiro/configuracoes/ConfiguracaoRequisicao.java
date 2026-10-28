package com.financeiro.configuracoes;

import java.math.BigDecimal;
import java.time.DateTimeException;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ConfiguracaoRequisicao(
        @NotNull(message = "Informe a moeda.") @Pattern(regexp = "BRL", message = "Use BRL neste laboratório.") String currency,
        @NotBlank(message = "Informe o fuso horário.") @Size(max = 60, message = "Informe um fuso válido.") String timezone,
        @NotNull(message = "Informe o tema.") @Pattern(regexp = "light|dark|custom|system", message = "Escolha um tema válido.") String themeMode,
        @NotNull(message = "Informe a densidade.") @Pattern(regexp = "compact|comfortable", message = "Escolha uma densidade válida.") String densityMode,
        @NotNull(message = "Informe o critério de período.") @Pattern(regexp = "due_date|competence", message = "Escolha vencimento ou competência.") String periodMode,
        @NotNull(message = "Informe o horizonte.") @Min(value = 1, message = "Use um horizonte entre 1 e 120 meses.")
        @Max(value = 120, message = "Use um horizonte entre 1 e 120 meses.") Integer horizonMonths,
        @NotNull(message = "Informe os dias de notificação.") @Size(max = 30, message = "Use até 30 dias de aviso.")
        List<@NotNull(message = "Informe um dia de aviso.") @Min(value = 0, message = "Use dias entre 0 e 365.")
                @Max(value = 365, message = "Use dias entre 0 e 365.") Integer> notificationDays,
        @NotNull(message = "Informe o horário de notificação.")
        @Pattern(regexp = "([01][0-9]|2[0-3]):[0-5][0-9]", message = "Use um horário entre 00:00 e 23:59.") String notificationTime,
        @NotNull(message = "Informe as cores.") @Valid Cores colorTokens,
        @NotNull(message = "Informe as preferências do painel.") @Valid Painel dashboardConfig,
        @NotNull(message = "Informe o estado da introdução.") @Valid Introducao onboarding) {
    @AssertTrue(message = "Informe um fuso horário válido.")
    public boolean isFusoValido() {
        if (timezone == null) return true;
        try {
            ZoneId.of(timezone);
            return true;
        } catch (DateTimeException exception) {
            return false;
        }
    }

    public record Cores(
            @NotNull(message = "Informe a cor.") @Pattern(regexp = "#([a-fA-F0-9]{3}|[a-fA-F0-9]{6})", message = "Use uma cor hexadecimal.") String primary,
            @NotNull(message = "Informe a cor.") @Pattern(regexp = "#([a-fA-F0-9]{3}|[a-fA-F0-9]{6})", message = "Use uma cor hexadecimal.") String accent,
            @NotNull(message = "Informe a cor.") @Pattern(regexp = "#([a-fA-F0-9]{3}|[a-fA-F0-9]{6})", message = "Use uma cor hexadecimal.") String positive,
            @NotNull(message = "Informe a cor.") @Pattern(regexp = "#([a-fA-F0-9]{3}|[a-fA-F0-9]{6})", message = "Use uma cor hexadecimal.") String negative,
            @NotNull(message = "Informe a cor.") @Pattern(regexp = "#([a-fA-F0-9]{3}|[a-fA-F0-9]{6})", message = "Use uma cor hexadecimal.") String neutral,
            @NotNull(message = "Informe a cor.") @Pattern(regexp = "#([a-fA-F0-9]{3}|[a-fA-F0-9]{6})", message = "Use uma cor hexadecimal.") String background,
            @NotNull(message = "Informe a cor.") @Pattern(regexp = "#([a-fA-F0-9]{3}|[a-fA-F0-9]{6})", message = "Use uma cor hexadecimal.") String card) {
    }

    public record Painel(
            @NotNull(message = "Informe os widgets.") @Size(max = 30, message = "Use até 30 widgets.")
            List<@NotBlank(message = "Informe um widget.") @Size(max = 40, message = "Use até 40 caracteres.") String> visibleWidgets,
            @NotNull(message = "Informe a ordenação.") @Pattern(regexp = "date_asc|date_desc|amount_desc", message = "Escolha uma ordenação válida.") String sortMode,
            @NotNull(message = "Informe o intervalo.") @Pattern(regexp = "month|quarter|year", message = "Escolha um intervalo válido.") String defaultRange,
            @Valid TemaUi uiTheme) {
    }

    public record TemaUi(
            @NotNull(message = "Informe a versão.") @Min(value = 1, message = "Use a versão 1.") @Max(value = 1, message = "Use a versão 1.") Integer version,
            @NotNull(message = "Informe o preset.") @Pattern(regexp = "default|mono|cobalt|sky|mint|iris|crimson|coral|sunset|carbon|bubblegum|parchment", message = "Escolha um preset válido.") String preset,
            @Size(max = 7, message = "Use até 7 cores.")
            Map<@NotNull(message = "Informe a função da cor.") @Pattern(regexp = "primary|secondary|success|info|warning|error|neutral", message = "Escolha uma função de cor válida.") String,
                    @NotNull(message = "Informe a paleta.") @Pattern(regexp = "[a-z][a-z0-9-]{0,39}", message = "Informe um nome de paleta válido.") String> colors,
            @Pattern(regexp = "Public Sans|Geist|Roboto|Figtree|Nunito|Manrope|Inter|Plus Jakarta Sans|Bricolage Grotesque|Outfit|Poppins|DM Sans", message = "Escolha uma fonte válida.") String font,
            @Pattern(regexp = "lucide|bootstrap|heroicons|iconoir|material|phosphor|remix|tabler", message = "Escolha ícones válidos.") String icons,
            @DecimalMin(value = "0", message = "Use um raio entre 0 e 4.") @DecimalMax(value = "4", message = "Use um raio entre 0 e 4.") BigDecimal radius) {
    }

    public record Introducao(
            @NotNull(message = "Informe a versão.") @Min(value = 1, message = "Use a versão 1.") @Max(value = 1, message = "Use a versão 1.") Integer version,
            @NotNull(message = "Informe o estado.") @Pattern(regexp = "new|active|dismissed|completed", message = "Escolha um estado válido.") String status,
            @NotNull(message = "Informe os passos concluídos.") @Size(max = 20, message = "Use até 20 passos.")
            List<@NotBlank(message = "Informe um passo.") @Size(max = 40, message = "Use até 40 caracteres.") String> completedSteps,
            @JsonFormat(shape = JsonFormat.Shape.STRING) Instant updatedAt) {
    }

    public record Tema(
            @NotNull(message = "Informe o tema.") @Pattern(regexp = "light|dark|custom|system", message = "Escolha um tema válido.") String themeMode,
            @NotNull(message = "Informe a densidade.") @Pattern(regexp = "compact|comfortable", message = "Escolha uma densidade válida.") String densityMode,
            @NotNull(message = "Informe as cores.") @Valid Cores colorTokens) {
    }

    public record PreferenciasPainel(
            @NotNull(message = "Informe o critério de período.") @Pattern(regexp = "due_date|competence", message = "Escolha vencimento ou competência.") String periodMode,
            @NotNull(message = "Informe o painel.") @Valid Painel dashboardConfig,
            @Pattern(regexp = "([01][0-9]|2[0-3]):[0-5][0-9]", message = "Use um horário entre 00:00 e 23:59.") String notificationTime) {
    }

    public record EstadoIntroducao(@NotNull(message = "Informe o estado da introdução.") @Valid Introducao onboarding) {
    }
}
