package com.pedro.financeirofamiliar;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.widget.RemoteViews;

import androidx.core.content.ContextCompat;

public class FinanceSummaryWidgetProvider extends AppWidgetProvider {
    public static final String PREFS_NAME = "finance_summary_widget";

    public static final String ACTION_REFRESH = "com.pedro.financeirofamiliar.WIDGET_REFRESH";
    private static final String KEY_BALANCE = "balance";
    private static final String KEY_BALANCE_IS_NEGATIVE = "balance_is_negative";
    private static final String KEY_INCOME = "income";
    private static final String KEY_EXPENSE = "expense";
    private static final String KEY_NEXT_DUE = "next_due";
    private static final String KEY_UPDATED = "updated";

    public static final class Snapshot {
        public final String balance;
        public final boolean balanceIsNegative;
        public final String income;
        public final String expense;
        public final String nextDue;
        public final String updated;

        Snapshot(
            String balance,
            boolean balanceIsNegative,
            String income,
            String expense,
            String nextDue,
            String updated
        ) {
            this.balance = balance;
            this.balanceIsNegative = balanceIsNegative;
            this.income = income;
            this.expense = expense;
            this.nextDue = nextDue;
            this.updated = updated;
        }
    }

    public static void saveSnapshot(
        Context context,
        String balance,
        boolean balanceIsNegative,
        String income,
        String expense,
        String nextDue,
        String updated
    ) {
        SharedPreferences.Editor editor = context
            .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit();

        editor.putString(KEY_BALANCE, balance);
        editor.putBoolean(KEY_BALANCE_IS_NEGATIVE, balanceIsNegative);
        editor.putString(KEY_INCOME, income);
        editor.putString(KEY_EXPENSE, expense);
        editor.putString(KEY_NEXT_DUE, nextDue);
        editor.putString(KEY_UPDATED, updated);
        editor.apply();
    }

    public static Snapshot readSnapshot(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        return new Snapshot(
            prefs.getString(KEY_BALANCE, "R$ 0,00"),
            prefs.getBoolean(KEY_BALANCE_IS_NEGATIVE, false),
            prefs.getString(KEY_INCOME, "↑ R$ 0,00"),
            prefs.getString(KEY_EXPENSE, "↓ R$ 0,00"),
            prefs.getString(KEY_NEXT_DUE, "Próximo vencimento: --"),
            prefs.getString(KEY_UPDATED, "Abra o app para atualizar")
        );
    }

    public static int getBalanceColor(Context context, Snapshot snapshot) {
        return ContextCompat.getColor(context, snapshot.balanceIsNegative ? R.color.widget_danger : R.color.widget_primary);
    }

    public static void setOpenAppPendingIntent(Context context, RemoteViews views, int rootId, int requestCode) {
        Intent openAppIntent = new Intent(context, MainActivity.class);
        openAppIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        PendingIntent pendingIntent = PendingIntent.getActivity(context, requestCode, openAppIntent, flags);
        views.setOnClickPendingIntent(rootId, pendingIntent);
    }

    public static void updateAllWidgetVariants(Context context) {
        updateAllWidgets(context);
        FinanceCompactWidgetProvider.updateAllWidgets(context);
        FinanceFlowWidgetProvider.updateAllWidgets(context);
        FinanceDueWidgetProvider.updateAllWidgets(context);
    }

    public static void updateAllWidgets(Context context) {
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        ComponentName provider = new ComponentName(context, FinanceSummaryWidgetProvider.class);
        int[] appWidgetIds = appWidgetManager.getAppWidgetIds(provider);
        updateWidgets(context, appWidgetManager, appWidgetIds);
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        updateWidgets(context, appWidgetManager, appWidgetIds);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (ACTION_REFRESH.equals(intent.getAction())) {
            updateAllWidgetVariants(context);
        }
    }

    private static void updateWidgets(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId);
        }
    }

    private static void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        Snapshot snapshot = readSnapshot(context);

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_finance_summary);
        views.setTextViewText(R.id.widget_balance, snapshot.balance);
        views.setTextViewText(R.id.widget_income, snapshot.income);
        views.setTextViewText(R.id.widget_expense, snapshot.expense);
        views.setTextViewText(R.id.widget_next_due, snapshot.nextDue);
        views.setTextViewText(R.id.widget_updated, snapshot.updated);
        views.setTextColor(R.id.widget_balance, getBalanceColor(context, snapshot));
        setOpenAppPendingIntent(context, views, R.id.widget_root, appWidgetId);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
