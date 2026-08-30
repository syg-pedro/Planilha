package com.pedro.financeirofamiliar;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;

public class FinanceCompactWidgetProvider extends AppWidgetProvider {
    public static void updateAllWidgets(Context context) {
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        ComponentName provider = new ComponentName(context, FinanceCompactWidgetProvider.class);
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
        if (FinanceSummaryWidgetProvider.ACTION_REFRESH.equals(intent.getAction())) {
            FinanceSummaryWidgetProvider.updateAllWidgetVariants(context);
        }
    }

    private static void updateWidgets(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId);
        }
    }

    private static void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        FinanceSummaryWidgetProvider.Snapshot snapshot = FinanceSummaryWidgetProvider.readSnapshot(context);

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_finance_compact);
        views.setTextViewText(R.id.widget_compact_balance, snapshot.balance);
        views.setTextViewText(R.id.widget_compact_updated, snapshot.updated);
        views.setTextColor(R.id.widget_compact_balance, FinanceSummaryWidgetProvider.getBalanceColor(context, snapshot));
        FinanceSummaryWidgetProvider.setOpenAppPendingIntent(context, views, R.id.widget_compact_root, appWidgetId + 1000);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
