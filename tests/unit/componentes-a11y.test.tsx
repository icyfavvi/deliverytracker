import React from "react";
import { StyleSheet } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { Boton } from "../../src/components/Boton";
import { CampoTexto } from "../../src/components/CampoTexto";
import { EstadoPedidoBadge } from "../../src/components/EstadoPedidoBadge";
import { StepperProgreso } from "../../src/components/StepperProgreso";
import { ProveedorTema } from "../../src/theme/ThemeProvider";
import { PUNTO_MINIMO } from "../../src/theme/tokens";
import {
  ETIQUETAS_ESTADO,
  ETIQUETAS_ESTADO_CORTA,
  FLUJO_ESTADOS,
} from "../../src/types/pedido";

async function renderConTema(ui: React.ReactElement) {
  return render(<ProveedorTema>{ui}</ProveedorTema>);
}

describe("Accesibilidad y renderizado de componentes UI", () => {
  describe("<Boton />", () => {
    it("renderiza etiqueta, cumple área táctil >= 44pt y dispara onPress", async () => {
      const onPress = jest.fn();
      await renderConTema(
        <Boton
          etiqueta="Confirmar compra"
          icono="package-check"
          iconoDerecha="arrow-right"
          onPress={onPress}
          accessibilityHint="Genera la orden en el sistema"
        />
      );

      const boton = screen.getByRole("button", { name: "Confirmar compra" });
      expect(boton.props.accessibilityHint).toBe(
        "Genera la orden en el sistema"
      );
      expect(boton.props.accessibilityState).toEqual({
        disabled: false,
        busy: false,
      });

      const estiloPlano = StyleSheet.flatten(boton.props.style);
      expect(estiloPlano.minHeight).toBeGreaterThanOrEqual(PUNTO_MINIMO);
      expect(estiloPlano.minWidth).toBeGreaterThanOrEqual(PUNTO_MINIMO);

      await fireEvent.press(boton);
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("bloquea interacción y expone estado busy/disabled cuando está deshabilitado o cargando", async () => {
      const onPress = jest.fn();
      const { rerender } = await renderConTema(
        <Boton
          etiqueta="Procesar"
          variante="peligro"
          deshabilitado
          onPress={onPress}
        />
      );

      const botonDeshabilitado = screen.getByRole("button", { name: "Procesar" });
      expect(botonDeshabilitado.props.accessibilityState).toEqual({
        disabled: true,
        busy: false,
      });
      await fireEvent.press(botonDeshabilitado);
      expect(onPress).not.toHaveBeenCalled();

      await rerender(
        <ProveedorTema>
          <Boton
            etiqueta="Guardando"
            variante="secundario"
            cargando
            anchoCompleto
            compacto
            onPress={onPress}
          />
        </ProveedorTema>
      );

      const botonCargando = screen.getByRole("button", { name: "Guardando" });
      expect(botonCargando.props.accessibilityState).toEqual({
        disabled: true,
        busy: true,
      });
      expect(screen.queryByText("Guardando")).toBeNull();
      await fireEvent.press(botonCargando);
      expect(onPress).not.toHaveBeenCalled();
    });
  });

  describe("<CampoTexto />", () => {
    it("muestra etiqueta uppercase, ayuda accesible y propaga cambios de texto", async () => {
      const onCambio = jest.fn();
      const onEnfocar = jest.fn();

      await renderConTema(
        <CampoTexto
          etiqueta="Código de orden"
          valor=""
          onCambio={onCambio}
          placeholder="ABCD"
          ayuda="Ingresa 4 caracteres alfanuméricos."
          icono="hash"
          onEnfocar={onEnfocar}
        />
      );

      expect(screen.getByText("CÓDIGO DE ORDEN")).toBeTruthy();
      expect(
        screen.getByText("Ingresa 4 caracteres alfanuméricos.")
      ).toBeTruthy();

      const input = screen.getByLabelText("Código de orden");
      expect(input.props.accessibilityHint).toBe(
        "Ingresa 4 caracteres alfanuméricos."
      );

      await fireEvent(input, "focus");
      expect(onEnfocar).toHaveBeenCalledTimes(1);

      await fireEvent.changeText(input, "A1B2");
      expect(onCambio).toHaveBeenCalledWith("A1B2");

      await fireEvent(input, "blur");
    });

    it("permite alternar visibilidad de contraseña con botón accesible >= 44pt", async () => {
      await renderConTema(
        <CampoTexto
          etiqueta="Contraseña"
          valor="Secreto123"
          onCambio={jest.fn()}
          secureTextEntry
          icono="lock"
        />
      );

      const input = screen.getByLabelText("Contraseña");
      expect(input.props.secureTextEntry).toBe(true);

      const toggleMostrar = screen.getByRole("button", {
        name: "Mostrar contraseña",
      });
      const estiloToggle = StyleSheet.flatten(toggleMostrar.props.style);
      expect(estiloToggle.minHeight).toBeGreaterThanOrEqual(PUNTO_MINIMO);
      expect(estiloToggle.minWidth).toBeGreaterThanOrEqual(PUNTO_MINIMO);

      await fireEvent.press(toggleMostrar);

      expect(screen.getByLabelText("Contraseña").props.secureTextEntry).toBe(
        false
      );
      expect(
        screen.getByRole("button", { name: "Ocultar contraseña" })
      ).toBeTruthy();
    });

    it("anuncia errores con accessibilityRole='alert' y oculta el texto de ayuda", async () => {
      await renderConTema(
        <CampoTexto
          etiqueta="Usuario"
          valor=""
          onCambio={jest.fn()}
          ayuda="Mínimo 3 caracteres."
          error="Completa este campo."
        />
      );

      const alerta = screen.getByRole("alert");
      expect(alerta.props.children).toBe("Completa este campo.");
      expect(screen.queryByText("Mínimo 3 caracteres.")).toBeNull();
    });
  });

  describe("<EstadoPedidoBadge />", () => {
    it.each(FLUJO_ESTADOS)(
      "renderiza texto + accessibilityLabel para estado '%s'",
      async (estado) => {
        await renderConTema(<EstadoPedidoBadge estado={estado} />);

        const etiqueta = ETIQUETAS_ESTADO[estado];
        expect(screen.getByText(etiqueta)).toBeTruthy();
        expect(
          screen.getByLabelText(`Estado del pedido: ${etiqueta}`)
        ).toBeTruthy();
      }
    );
  });

  describe("<StepperProgreso />", () => {
    it.each(FLUJO_ESTADOS.map((estado, idx) => [estado, idx] as const))(
      "expone progressbar accesible para '%s' (paso %i)",
      async (estado, indice) => {
        await renderConTema(<StepperProgreso estado={estado} />);

        const etiquetaEsperada = `Progreso del despacho: paso ${indice + 1} de ${FLUJO_ESTADOS.length}, ${ETIQUETAS_ESTADO_CORTA[estado]}`;
        const bar = screen.getByLabelText(etiquetaEsperada);
        expect(bar.props.accessibilityRole).toBe("progressbar");

        for (const paso of FLUJO_ESTADOS) {
          expect(screen.getByText(ETIQUETAS_ESTADO_CORTA[paso])).toBeTruthy();
        }
      }
    );
  });
});
