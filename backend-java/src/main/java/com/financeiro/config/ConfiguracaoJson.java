package com.financeiro.config;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.cfg.CoercionAction;
import com.fasterxml.jackson.databind.cfg.CoercionInputShape;
import com.fasterxml.jackson.databind.type.LogicalType;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ConfiguracaoJson {
    @Bean
    Jackson2ObjectMapperBuilderCustomizer validarTiposJson() {
        return builder -> builder
                .featuresToEnable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
                .featuresToDisable(DeserializationFeature.ACCEPT_FLOAT_AS_INT,
                        MapperFeature.ALLOW_COERCION_OF_SCALARS)
                .postConfigurer(mapper -> {
                    var texto = mapper.coercionConfigFor(LogicalType.Textual);
                    texto.setCoercion(CoercionInputShape.Integer, CoercionAction.Fail);
                    texto.setCoercion(CoercionInputShape.Float, CoercionAction.Fail);
                    texto.setCoercion(CoercionInputShape.Boolean, CoercionAction.Fail);
                });
    }
}
