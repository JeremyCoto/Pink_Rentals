SET SERVEROUTPUT ON;

BEGIN
    DBMS_OUTPUT.PUT_LINE('>>> INICIO DE CARGA MASIVA TRANSACCIONAL (50+ REGISTROS) <<<');

    -- ==========================================================================
    -- EVENTO 5: Boda Civil en Cartago (Cliente 10 - Sofia Guzmán)
    -- Fecha: Pasada (Mayo 2024) - Estado: Completado/Pagado
    -- ==========================================================================
    -- 1. Reserva
    FIDE_PROYECTO_FINAL_PKG.FIDE_RESERVACIONES_INSERTAR_SP(910, TO_DATE('2024-05-15','YYYY-MM-DD'), TO_TIMESTAMP('15:00','HH24:MI'), TO_TIMESTAMP('20:00','HH24:MI'), '700000010', 510);
    
    -- 2. Detalle (Servicio de Fotografía de Boda)
    FIDE_PROYECTO_FINAL_PKG.FIDE_DETALLE_RESERVACION_INSERTAR_SP(910, 1, 1, 650000, 2004, NULL); 
    
    -- 3. Asignación (Cámara y Lentes)
    FIDE_PROYECTO_FINAL_PKG.FIDE_ASIGNACION_INSERTAR_SP(10010, 'Cámara Principal Sony A7IV', 1006, 910);
    
    -- 4. Pago (Transferencia - Total con IVA aprox)
    FIDE_PROYECTO_FINAL_PKG.FIDE_PAGOS_INSERTAR_SP(7010, TO_DATE('2024-05-10','YYYY-MM-DD'), 734500, 101);
    
    -- 5. Facturación
    FIDE_PROYECTO_FINAL_PKG.FIDE_FACTURACION_INSERTAR_SP(6010, TO_DATE('2024-05-10','YYYY-MM-DD'), 734500, 84500, 'Cobertura Boda Civil', 7010, 910);
    
    -- 6. Detalle Factura
    FIDE_PROYECTO_FINAL_PKG.FIDE_DETALLE_FACTURA_INSERTAR_SP(6010, 1, 1, 650000, 650000, 2004);


    -- ==========================================================================
    -- EVENTO 6: Cumpleaños en San José (Cliente 11 - Javier Vargas)
    -- Fecha: Pasada (Junio 2024) - Alquiler de Booth 360
    -- ==========================================================================
    FIDE_PROYECTO_FINAL_PKG.FIDE_RESERVACIONES_INSERTAR_SP(911, TO_DATE('2024-06-20','YYYY-MM-DD'), TO_TIMESTAMP('19:00','HH24:MI'), TO_TIMESTAMP('22:00','HH24:MI'), '700000011', 511);
    
    FIDE_PROYECTO_FINAL_PKG.FIDE_DETALLE_RESERVACION_INSERTAR_SP(911, 1, 1, 250000, 2001, NULL); -- Booth 360
    
    FIDE_PROYECTO_FINAL_PKG.FIDE_ASIGNACION_INSERTAR_SP(10011, 'Plataforma 360 #2', 1007, 911);
    
    FIDE_PROYECTO_FINAL_PKG.FIDE_PAGOS_INSERTAR_SP(7011, TO_DATE('2024-06-18','YYYY-MM-DD'), 282500, 100); -- Tarjeta
    
    FIDE_PROYECTO_FINAL_PKG.FIDE_FACTURACION_INSERTAR_SP(6011, TO_DATE('2024-06-18','YYYY-MM-DD'), 282500, 32500, 'Alquiler Booth 360 Cumpleaños', 7011, 911);
    
    FIDE_PROYECTO_FINAL_PKG.FIDE_DETALLE_FACTURA_INSERTAR_SP(6011, 1, 1, 250000, 250000, 2001);


    -- ==========================================================================
    -- EVENTO 7: Fiesta de Empresa en Escazú (Cliente 13 - Marco Poveda)
    -- Fecha: Pasada (Julio 2024) - Paquete Grande (Pista + Letras)
    -- ==========================================================================
    FIDE_PROYECTO_FINAL_PKG.FIDE_RESERVACIONES_INSERTAR_SP(912, TO_DATE('2024-07-15','YYYY-MM-DD'), TO_TIMESTAMP('18:00','HH24:MI'), TO_TIMESTAMP('23:00','HH24:MI'), '700000013', 513);
    
    -- Dos servicios en la misma reserva
    FIDE_PROYECTO_FINAL_PKG.FIDE_DETALLE_RESERVACION_INSERTAR_SP(912, 1, 1, 350000, 2002, NULL); -- Pista LED
    FIDE_PROYECTO_FINAL_PKG.FIDE_DETALLE_RESERVACION_INSERTAR_SP(912, 2, 1, 80000, 2003, NULL);  -- Letras LOVE
    
    FIDE_PROYECTO_FINAL_PKG.FIDE_ASIGNACION_INSERTAR_SP(10012, 'Instalacion Pista 4x5m', 1005, 912);
    FIDE_PROYECTO_FINAL_PKG.FIDE_ASIGNACION_INSERTAR_SP(10013, 'Letras Gigantes Set 2', 1001, 912);
    
    FIDE_PROYECTO_FINAL_PKG.FIDE_PAGOS_INSERTAR_SP(7012, TO_DATE('2024-07-10','YYYY-MM-DD'), 485900, 101); -- 430k + IVA
    
    FIDE_PROYECTO_FINAL_PKG.FIDE_FACTURACION_INSERTAR_SP(6012, TO_DATE('2024-07-10','YYYY-MM-DD'), 485900, 55900, 'Evento TechCR MidYear', 7012, 912);
    
    FIDE_PROYECTO_FINAL_PKG.FIDE_DETALLE_FACTURA_INSERTAR_SP(6012, 1, 1, 350000, 350000, 2002);
    FIDE_PROYECTO_FINAL_PKG.FIDE_DETALLE_FACTURA_INSERTAR_SP(6012, 2, 1, 80000, 80000, 2003);


    -- ==========================================================================
    -- EVENTO 8: Boda en Playa Hermosa (Cliente 22 - Monica Navarro / Wedding Planner)
    -- Fecha: Futura (Marzo 2025) - Paquete Completo
    -- ==========================================================================
    FIDE_PROYECTO_FINAL_PKG.FIDE_RESERVACIONES_INSERTAR_SP(913, TO_DATE('2025-03-22','YYYY-MM-DD'), TO_TIMESTAMP('16:00','HH24:MI'), TO_TIMESTAMP('23:59','HH24:MI'), '700000022', 522);
    
    -- Uso del PAQUETE ID 50 (Boda Premium)
    FIDE_PROYECTO_FINAL_PKG.FIDE_DETALLE_RESERVACION_INSERTAR_SP(913, 1, 1, 600000, NULL, 50); 
    
    FIDE_PROYECTO_FINAL_PKG.FIDE_ASIGNACION_INSERTAR_SP(10014, 'Reserva Equipo Completo Guanacaste', 1005, 913);
    
    -- Pago Anticipado del 50%
    FIDE_PROYECTO_FINAL_PKG.FIDE_PAGOS_INSERTAR_SP(7013, SYSDATE, 339000, 101); 
    
    FIDE_PROYECTO_FINAL_PKG.FIDE_FACTURACION_INSERTAR_SP(6013, SYSDATE, 339000, 39000, 'Anticipo Boda Destination', 7013, 913);
    
    -- Nota: Al facturar un paquete, a veces se desglosa o se pone un servicio genérico, aquí usaremos el servicio principal del paquete como referencia (2001) para el detalle
    FIDE_PROYECTO_FINAL_PKG.FIDE_DETALLE_FACTURA_INSERTAR_SP(6013, 1, 1, 300000, 300000, 2001);


    -- ==========================================================================
    -- EVENTO 9: Graduación Colegio (Cliente 17 - Ricardo Jiménez)
    -- Fecha: Diciembre 2024 
    -- ==========================================================================
    FIDE_PROYECTO_FINAL_PKG.FIDE_RESERVACIONES_INSERTAR_SP(914, TO_DATE('2024-12-10','YYYY-MM-DD'), TO_TIMESTAMP('18:00','HH24:MI'), TO_TIMESTAMP('23:00','HH24:MI'), '700000017', 517);
    
    FIDE_PROYECTO_FINAL_PKG.FIDE_DETALLE_RESERVACION_INSERTAR_SP(914, 1, 2, 250000, 2001, NULL); -- 2 Booths 360 (Cantidad 2)
    
    FIDE_PROYECTO_FINAL_PKG.FIDE_ASIGNACION_INSERTAR_SP(10015, 'Booth 1 y 2 asignados', 1007, 914);
    
    FIDE_PROYECTO_FINAL_PKG.FIDE_PAGOS_INSERTAR_SP(7014, SYSDATE, 565000, 102); -- Efectivo
    
    FIDE_PROYECTO_FINAL_PKG.FIDE_FACTURACION_INSERTAR_SP(6014, SYSDATE, 565000, 65000, 'Graduación Heredia', 7014, 914);
    
    FIDE_PROYECTO_FINAL_PKG.FIDE_DETALLE_FACTURA_INSERTAR_SP(6014, 1, 2, 250000, 500000, 2001);


    -- ==========================================================================
    -- EVENTO 10: Quinceaños (Cliente 26 - Ana Castillo)
    -- Fecha: Enero 2025
    -- ==========================================================================
    FIDE_PROYECTO_FINAL_PKG.FIDE_RESERVACIONES_INSERTAR_SP(915, TO_DATE('2025-01-15','YYYY-MM-DD'), TO_TIMESTAMP('19:00','HH24:MI'), TO_TIMESTAMP('23:00','HH24:MI'), '700000026', 526);
    
    FIDE_PROYECTO_FINAL_PKG.FIDE_DETALLE_RESERVACION_INSERTAR_SP(915, 1, 1, 80000, 2003, NULL); -- Letras LOVE (usadas como XV)
    
    FIDE_PROYECTO_FINAL_PKG.FIDE_ASIGNACION_INSERTAR_SP(10016, 'Letras XV Años (Personalizadas)', 1001, 915);
    
    FIDE_PROYECTO_FINAL_PKG.FIDE_PAGOS_INSERTAR_SP(7015, SYSDATE, 90400, 103); -- Billetera Digital
    
    FIDE_PROYECTO_FINAL_PKG.FIDE_FACTURACION_INSERTAR_SP(6015, SYSDATE, 90400, 10400, 'Quinceaños Ana', 7015, 915);
    
    FIDE_PROYECTO_FINAL_PKG.FIDE_DETALLE_FACTURA_INSERTAR_SP(6015, 1, 1, 80000, 80000, 2003);


    -- ==========================================================================
    -- EVENTO 11: Sesión Fotos Corporativa (Cliente 35 - Hector Mata)
    -- ==========================================================================
    FIDE_PROYECTO_FINAL_PKG.FIDE_RESERVACIONES_INSERTAR_SP(916, TO_DATE('2024-11-28','YYYY-MM-DD'), TO_TIMESTAMP('08:00','HH24:MI'), TO_TIMESTAMP('12:00','HH24:MI'), '700000035', 535);
    
    FIDE_PROYECTO_FINAL_PKG.FIDE_DETALLE_RESERVACION_INSERTAR_SP(916, 1, 0.5, 650000, 2004, NULL); -- Media jornada (0.5 de cantidad)
    
    FIDE_PROYECTO_FINAL_PKG.FIDE_ASIGNACION_INSERTAR_SP(10017, 'Equipo Fotografía Estudio', 1006, 916);
    
    FIDE_PROYECTO_FINAL_PKG.FIDE_PAGOS_INSERTAR_SP(7016, TO_DATE('2024-11-20','YYYY-MM-DD'), 367250, 101); -- 325k + IVA
    
    FIDE_PROYECTO_FINAL_PKG.FIDE_FACTURACION_INSERTAR_SP(6016, TO_DATE('2024-11-20','YYYY-MM-DD'), 367250, 42250, 'Sesión Fotos Ejecutivos', 7016, 916);
    
    FIDE_PROYECTO_FINAL_PKG.FIDE_DETALLE_FACTURA_INSERTAR_SP(6016, 1, 0.5, 650000, 325000, 2004);


    -- ==========================================================================
    -- EVENTO 12: Aniversario Restaurante (Cliente 29 - Manuel Ulate)
    -- ==========================================================================
    FIDE_PROYECTO_FINAL_PKG.FIDE_RESERVACIONES_INSERTAR_SP(917, TO_DATE('2025-02-01','YYYY-MM-DD'), TO_TIMESTAMP('18:00','HH24:MI'), TO_TIMESTAMP('23:00','HH24:MI'), '700000029', 529);
    
    FIDE_PROYECTO_FINAL_PKG.FIDE_DETALLE_RESERVACION_INSERTAR_SP(917, 1, 1, 250000, 2001, NULL); 
    
    FIDE_PROYECTO_FINAL_PKG.FIDE_ASIGNACION_INSERTAR_SP(10018, 'Activación de Marca', 1007, 917);
    
    FIDE_PROYECTO_FINAL_PKG.FIDE_PAGOS_INSERTAR_SP(7017, SYSDATE, 282500, 101);
    
    FIDE_PROYECTO_FINAL_PKG.FIDE_FACTURACION_INSERTAR_SP(6017, SYSDATE, 282500, 32500, 'Aniversario Pavas', 7017, 917);
    
    FIDE_PROYECTO_FINAL_PKG.FIDE_DETALLE_FACTURA_INSERTAR_SP(6017, 1, 1, 250000, 250000, 2001);


    -- ==========================================================================
    -- EVENTO 13: Boda Pequeña (Cliente 38 - Lorena Espinoza)
    -- ==========================================================================
    FIDE_PROYECTO_FINAL_PKG.FIDE_RESERVACIONES_INSERTAR_SP(918, TO_DATE('2025-04-10','YYYY-MM-DD'), TO_TIMESTAMP('14:00','HH24:MI'), TO_TIMESTAMP('20:00','HH24:MI'), '700000038', 538);
    
    FIDE_PROYECTO_FINAL_PKG.FIDE_DETALLE_RESERVACION_INSERTAR_SP(918, 1, 1, 650000, 2004, NULL);
    FIDE_PROYECTO_FINAL_PKG.FIDE_DETALLE_RESERVACION_INSERTAR_SP(918, 2, 1, 80000, 2003, NULL);
    
    FIDE_PROYECTO_FINAL_PKG.FIDE_ASIGNACION_INSERTAR_SP(10019, 'Boda Playa Coco', 1006, 918);
    
    -- Pago Parcial
    FIDE_PROYECTO_FINAL_PKG.FIDE_PAGOS_INSERTAR_SP(7018, SYSDATE, 400000, 101); 
    
    FIDE_PROYECTO_FINAL_PKG.FIDE_FACTURACION_INSERTAR_SP(6018, SYSDATE, 400000, 0, 'Abono Boda Lorena', 7018, 918);
    
    FIDE_PROYECTO_FINAL_PKG.FIDE_DETALLE_FACTURA_INSERTAR_SP(6018, 1, 1, 400000, 400000, 2004);


    -- ==========================================================================
    -- EVENTO 14: Inauguración Tienda (Cliente 30 - Carolina Vindas)
    -- ==========================================================================
    FIDE_PROYECTO_FINAL_PKG.FIDE_RESERVACIONES_INSERTAR_SP(919, TO_DATE('2024-12-05','YYYY-MM-DD'), TO_TIMESTAMP('10:00','HH24:MI'), TO_TIMESTAMP('14:00','HH24:MI'), '700000030', 530);
    
    FIDE_PROYECTO_FINAL_PKG.FIDE_DETALLE_RESERVACION_INSERTAR_SP(919, 1, 1, 350000, 2002, NULL); -- Pista (usada como tarima)
    
    FIDE_PROYECTO_FINAL_PKG.FIDE_ASIGNACION_INSERTAR_SP(10020, 'Tarima LED', 1005, 919);
    
    FIDE_PROYECTO_FINAL_PKG.FIDE_PAGOS_INSERTAR_SP(7019, SYSDATE, 395500, 101);
    
    FIDE_PROYECTO_FINAL_PKG.FIDE_FACTURACION_INSERTAR_SP(6019, SYSDATE, 395500, 45500, 'Inauguración Alajuela', 7019, 919);
    
    FIDE_PROYECTO_FINAL_PKG.FIDE_DETALLE_FACTURA_INSERTAR_SP(6019, 1, 1, 350000, 350000, 2002);


    -- ==========================================================================
    -- EVENTO 15: Evento Escolar (Cliente 40 - Silvia Reyes)
    -- ==========================================================================
    FIDE_PROYECTO_FINAL_PKG.FIDE_RESERVACIONES_INSERTAR_SP(920, TO_DATE('2024-11-30','YYYY-MM-DD'), TO_TIMESTAMP('08:00','HH24:MI'), TO_TIMESTAMP('13:00','HH24:MI'), '700000040', 540);
    
    FIDE_PROYECTO_FINAL_PKG.FIDE_DETALLE_RESERVACION_INSERTAR_SP(920, 1, 1, 250000, 2001, NULL); 
    
    FIDE_PROYECTO_FINAL_PKG.FIDE_ASIGNACION_INSERTAR_SP(10021, 'Booth 360 Escolar', 1007, 920);
    
    FIDE_PROYECTO_FINAL_PKG.FIDE_PAGOS_INSERTAR_SP(7020, SYSDATE, 282500, 102); -- Efectivo
    
    FIDE_PROYECTO_FINAL_PKG.FIDE_FACTURACION_INSERTAR_SP(6020, SYSDATE, 282500, 32500, 'Feria Escolar', 7020, 920);
    
    FIDE_PROYECTO_FINAL_PKG.FIDE_DETALLE_FACTURA_INSERTAR_SP(6020, 1, 1, 250000, 250000, 2001);


    -- ==========================================================================
    -- EVENTO 16: Reserva Cancelada (Cliente 33 - Gustavo Perez)
    -- ==========================================================================
    FIDE_PROYECTO_FINAL_PKG.FIDE_RESERVACIONES_INSERTAR_SP(921, TO_DATE('2025-01-01','YYYY-MM-DD'), TO_TIMESTAMP('00:00','HH24:MI'), TO_TIMESTAMP('05:00','HH24:MI'), '700000033', 533);
    
    FIDE_PROYECTO_FINAL_PKG.FIDE_DETALLE_RESERVACION_INSERTAR_SP(921, 1, 1, 650000, 2004, NULL);
    
    -- Eliminación lógica a estado "Cancelado" (5)
    FIDE_PROYECTO_FINAL_PKG.FIDE_RESERVACIONES_ELIMINAR_SP(921, 5);


    DBMS_OUTPUT.PUT_LINE('>>> CARGA MASIVA TRANSACCIONAL FINALIZADA CON EXITO <<<');
END;
/