package com.pedro.financeirofamiliar;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "FinanceWidget")
public class FinanceWidgetPlugin extends Plugin {
    @PluginMethod
    public void updateSnapshot(PluginCall call) {
        String balance = valueOrDefault(call.getString("balance"), "R$ 0,00");
        String income = valueOrDefault(call.getString("income"), "↑ R$ 0,00");
        String expense = valueOrDefault(call.getString("expense"), "↓ R$ 0,00");
        String nextDue = valueOrDefault(call.getString("nextDue"), "Próximo vencimento: --");
        String updated = valueOrDefault(call.getString("updated"), "Atualizado agora");
        boolean balanceIsNegative = Boolean.TRUE.equals(call.getBoolean("balanceIsNegative"));

        FinanceSummaryWidgetProvider.saveSnapshot(
            getContext(),
            balance,
            balanceIsNegative,
            income,
            expense,
            nextDue,
            updated
        );
        FinanceSummaryWidgetProvider.updateAllWidgets(getContext());

        call.resolve();
    }

    private String valueOrDefault(String value, String fallback) {
        return value == null || value.trim().isEmpty() ? fallback : value;
    }
}
