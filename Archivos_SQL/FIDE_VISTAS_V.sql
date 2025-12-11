----------------------------------------------------------------
-- 1. FIDE_RESERVACIONES_DETALLE_V
-- Vista que muestra información completa de las reservaciones,
-- incluyendo cliente, servicio, fecha, hora y estado.
----------------------------------------------------------------
CREATE OR REPLACE VIEW FIDE_RESERVACIONES_DETALLE_V AS
SELECT
    R.RESERVACIONES_ID_RESERVACION_PK     AS "Código Reservación",
    U.nombre || ' ' || U.primer_apellido || ' ' || U.segundo_apellido AS "Nombre del Cliente",
    R.fecha_reservacion                   AS "Fecha",
    R.hora_inicio                         AS "Hora Inicio",
    R.hora_fin                            AS "Hora Fin",
    S.nombre                              AS "Servicio",
    S.precio                              AS "Precio Servicio",
    E.estado                              AS "Estado"
FROM
    G2_SC508_VT_PROYECTO.FIDE_RESERVACIONES_TB R
JOIN
    G2_SC508_VT_PROYECTO.FIDE_USUARIOS_TB U
    ON R.USUARIOS_ID_CEDULA_PK = U.USUARIOS_ID_CEDULA_PK
JOIN
    G2_SC508_VT_PROYECTO.FIDE_DETALLE_RESERVACION_TB DR
    ON DR.RESERVACIONES_ID_RESERVACION_PK = R.RESERVACIONES_ID_RESERVACION_PK
JOIN
    G2_SC508_VT_PROYECTO.FIDE_SERVICIOS_TB S
    ON DR.SERVICIOS_ID_SERVICIO_PK = S.SERVICIOS_ID_SERVICIO_PK
JOIN
    G2_SC508_VT_PROYECTO.FIDE_ESTADOS_TB E
    ON R.ESTADOS_ID_ESTADO_PK = E.ESTADOS_ID_ESTADO_PK
ORDER BY
    R.fecha_reservacion DESC, R.hora_inicio;
/
COMMIT;

----------------------------------------------------------------------------
-- 2. FIDE_FACTURACION_RESUMEN_V
-- Vista que muestra resumen de facturación: cliente, fecha, monto y estado.
----------------------------------------------------------------------------
CREATE OR REPLACE VIEW FIDE_FACTURACION_RESUMEN_V AS
SELECT
    F.FACTURACION_ID_NUMERO_FACTURA_PK    AS "Número Factura",
    U.nombre || ' ' || U.primer_apellido || ' ' || U.segundo_apellido AS "Cliente",
    F.fecha_emision                        AS "Fecha Emisión",
    F.monto_total                           AS "Monto Total",
    E.estado                                AS "Estado Factura"
FROM
    G2_SC508_VT_PROYECTO.FIDE_FACTURACION_TB F
JOIN
    G2_SC508_VT_PROYECTO.FIDE_RESERVACIONES_TB R
    ON F.RESERVACIONES_ID_RESERVACION_PK = R.RESERVACIONES_ID_RESERVACION_PK
JOIN
    G2_SC508_VT_PROYECTO.FIDE_USUARIOS_TB U
    ON R.USUARIOS_ID_CEDULA_PK = U.USUARIOS_ID_CEDULA_PK
JOIN
    G2_SC508_VT_PROYECTO.FIDE_ESTADOS_TB E
    ON F.ESTADOS_ID_ESTADO_PK = E.ESTADOS_ID_ESTADO_PK
ORDER BY
    F.fecha_emision DESC;
/
COMMIT;

---------------------------------------------------------------------
-- 3. FIDE_SERVICIOS_MAS_CONTRATADOS_V
-- Vista que muestra cuántas veces ha sido contratado cada servicio.
---------------------------------------------------------------------
CREATE OR REPLACE VIEW FIDE_SERVICIOS_MAS_CONTRATADOS_V AS
SELECT
    S.nombre AS "Servicio",
    COUNT(DR.SERVICIOS_ID_SERVICIO_PK) AS "Cantidad Contratado",
    S.precio AS "Precio Base"
FROM
    G2_SC508_VT_PROYECTO.FIDE_SERVICIOS_TB S
LEFT JOIN
    G2_SC508_VT_PROYECTO.FIDE_DETALLE_RESERVACION_TB DR
    ON S.SERVICIOS_ID_SERVICIO_PK = DR.SERVICIOS_ID_SERVICIO_PK
GROUP BY
    S.nombre, S.precio
ORDER BY
    "Cantidad Contratado" DESC;
/
COMMIT;

----------------------------------------------------------
-- 4. FIDE_CLIENTES_V
-- Vista con información general de clientes registrados.
----------------------------------------------------------
CREATE OR REPLACE VIEW FIDE_CLIENTES_V AS
SELECT
    U.USUARIOS_ID_CEDULA_PK AS "Cédula",
    U.nombre                 AS "Nombre",
    U.primer_apellido        AS "Primer Apellido",
    U.segundo_apellido       AS "Segundo Apellido",
    C.telefono               AS "Teléfono",
    E.estado                 AS "Estado"
FROM
    G2_SC508_VT_PROYECTO.FIDE_USUARIOS_TB U
JOIN
    G2_SC508_VT_PROYECTO.FIDE_CLIENTES_TB C
    ON U.USUARIOS_ID_CEDULA_PK = C.USUARIOS_ID_CEDULA_PK
JOIN
    G2_SC508_VT_PROYECTO.FIDE_ESTADOS_TB E
    ON U.ESTADOS_ID_ESTADO_PK = E.ESTADOS_ID_ESTADO_PK
ORDER BY
    U.nombre;
/
COMMIT;

-------------------------------------------------------------
-- 5. FIDE_INVENTARIO_PRODUCTOS_V
-- Vista que muestra información del inventario de productos.
-------------------------------------------------------------
CREATE OR REPLACE VIEW FIDE_INVENTARIO_PRODUCTOS_V AS
SELECT
    P.PRODUCTO_ID_PRODUCTO_PK AS "Código Producto",
    P.nombre                   AS "Nombre Producto",
    P.descripcion              AS "Descripción",
    P.cantidad                 AS "Cantidad Disponible",
    CP.nombre                  AS "Categoría",
    E.estado                   AS "Estado"
FROM
    G2_SC508_VT_PROYECTO.FIDE_PRODUCTOS_TB P
JOIN
    G2_SC508_VT_PROYECTO.FIDE_CATEGORIA_PRODUCTO_TB CP
    ON P.CATEGORIA_PRODUCTO_ID_CATEGORIA_PK = CP.CATEGORIA_PRODUCTO_ID_CATEGORIA_PK
JOIN
    G2_SC508_VT_PROYECTO.FIDE_ESTADOS_TB E
    ON P.ESTADOS_ID_ESTADO_PK = E.ESTADOS_ID_ESTADO_PK
ORDER BY
    P.nombre;
/
COMMIT;

-------------------------------------------------------------
-- 6. FIDE_EMPLEADOS_INFO_V
-- Vista que muestra información completa de los empleados,
-- incluyendo datos personales, rol asignado, puesto y estado.
-------------------------------------------------------------
CREATE OR REPLACE VIEW FIDE_EMPLEADOS_INFO_V AS
SELECT
    E.USUARIOS_ID_CEDULA_PK     AS "Cédula",
    U.nombre                    AS "Nombre",
    U.primer_apellido           AS "Primer Apellido",
    U.segundo_apellido          AS "Segundo Apellido",
    E.puesto                    AS "Puesto",
    E.fecha_contratacion        AS "Fecha Contratación",
    R.nombre_rol                AS "Rol",
    ES.estado                   AS "Estado Usuario"
FROM
    G2_SC508_VT_PROYECTO.FIDE_EMPLEADOS_TB E
JOIN
    G2_SC508_VT_PROYECTO.FIDE_USUARIOS_TB U
        ON E.USUARIOS_ID_CEDULA_PK = U.USUARIOS_ID_CEDULA_PK
JOIN
    G2_SC508_VT_PROYECTO.FIDE_ROLES_TB R
        ON U.ROLES_ID_ROL_PK = R.ROLES_ID_ROL_PK
JOIN
    G2_SC508_VT_PROYECTO.FIDE_ESTADOS_TB ES
        ON U.ESTADOS_ID_ESTADO_PK = ES.ESTADOS_ID_ESTADO_PK
ORDER BY
    U.primer_apellido, U.nombre;
/
COMMIT;

-----------------------------------------------------------------------
-- 7. FIDE_PAGOS_DETALLE_V
-- Vista que muestra el detalle de los pagos realizados, incluyendo
-- método de pago, monto, fecha, estado y cliente asociado.
-----------------------------------------------------------------------
CREATE OR REPLACE VIEW FIDE_PAGOS_DETALLE_V AS
SELECT
    P.PAGOS_ID_PAGO_PK           AS "ID Pago",
    P.fecha_pago                 AS "Fecha Pago",
    P.monto                      AS "Monto",
    MP.nombre                    AS "Método de Pago",
    E.estado                     AS "Estado Pago",
    U.nombre || ' ' || U.primer_apellido AS "Cliente"
FROM
    G2_SC508_VT_PROYECTO.FIDE_PAGOS_TB P
JOIN
    G2_SC508_VT_PROYECTO.FIDE_METODO_PAGO_TB MP
        ON P.METODO_PAGO_ID_METODO_PK = MP.METODO_PAGO_ID_METODO_PK
JOIN
    G2_SC508_VT_PROYECTO.FIDE_ESTADOS_TB E
        ON P.ESTADOS_ID_ESTADO_PK = E.ESTADOS_ID_ESTADO_PK
LEFT JOIN
    G2_SC508_VT_PROYECTO.FIDE_FACTURACION_TB F
        ON F.PAGOS_ID_PAGO_PK = P.PAGOS_ID_PAGO_PK
LEFT JOIN
    G2_SC508_VT_PROYECTO.FIDE_RESERVACIONES_TB R
        ON R.RESERVACIONES_ID_RESERVACION_PK = F.RESERVACIONES_ID_RESERVACION_PK
LEFT JOIN
    G2_SC508_VT_PROYECTO.FIDE_USUARIOS_TB U
        ON U.USUARIOS_ID_CEDULA_PK = R.USUARIOS_ID_CEDULA_PK
ORDER BY
    P.fecha_pago DESC;
/
COMMIT;

---------------------------------------------------------------------------
-- 8. FIDE_DIRECCIONES_CLIENTE_V
-- Vista que muestra las direcciones completas de cada cliente, integrando
-- provincia, cantón, distrito, descripción detallada y estado del registro.
---------------------------------------------------------------------------
CREATE OR REPLACE VIEW FIDE_DIRECCIONES_CLIENTE_V AS
SELECT
    D.DIRECCIONES_ID_DIRECCION_PK AS "ID Dirección",
    U.USUARIOS_ID_CEDULA_PK       AS "Cédula",
    U.nombre || ' ' || U.primer_apellido AS "Cliente",
    PR.nombre                     AS "Provincia",
    C.nombre                      AS "Cantón",
    DI.nombre                     AS "Distrito",
    D.descripcion                 AS "Descripción",
    ES.estado                     AS "Estado Dirección"
FROM
    G2_SC508_VT_PROYECTO.FIDE_DIRECCIONES_TB D
JOIN
    G2_SC508_VT_PROYECTO.FIDE_USUARIOS_TB U
        ON D.USUARIOS_ID_CEDULA_PK = U.USUARIOS_ID_CEDULA_PK
JOIN
    G2_SC508_VT_PROYECTO.FIDE_DISTRITO_TB DI
        ON D.DISTRITO_ID_DISTRITO_PK = DI.DISTRITO_ID_DISTRITO_PK
JOIN
    G2_SC508_VT_PROYECTO.FIDE_CANTON_TB C
        ON C.CANTON_ID_CANTON_PK = DI.CANTON_ID_CANTON_PK
JOIN
    G2_SC508_VT_PROYECTO.FIDE_PROVINCIA_TB PR
        ON PR.PROVINCIA_ID_PROVINCIA_PK = C.PROVINCIA_ID_PROVINCIA_PK
JOIN
    G2_SC508_VT_PROYECTO.FIDE_ESTADOS_TB ES
        ON D.ESTADOS_ID_ESTADO_PK = ES.ESTADOS_ID_ESTADO_PK
ORDER BY
    U.nombre;
/
COMMIT;

---------------------------------------------------------------------------
-- 9. FIDE_DETALLE_FACTURA_V
-- Vista que muestra el detalle de las facturas emitidas, incluyendo
-- número de línea, servicio, cantidad, precios y subtotal calculado.
---------------------------------------------------------------------------
CREATE OR REPLACE VIEW FIDE_DETALLE_FACTURA_V AS
SELECT
    DF.FACTURACION_ID_NUMERO_FACTURA_FK AS "Número Factura",
    DF.NUMERO_LINEA                     AS "Línea",
    S.nombre                            AS "Servicio",
    DF.cantidad                         AS "Cantidad",
    DF.precio_unitario                  AS "Precio Unitario",
    DF.subtotal_linea                   AS "Subtotal",
    (DF.cantidad * DF.precio_unitario)  AS "Cálculo Subtotal"
FROM
    G2_SC508_VT_PROYECTO.FIDE_DETALLE_FACTURA_TB DF
JOIN
    G2_SC508_VT_PROYECTO.FIDE_SERVICIOS_TB S
        ON DF.SERVICIOS_ID_SERVICIO_PK = S.SERVICIOS_ID_SERVICIO_PK
ORDER BY
    DF.FACTURACION_ID_NUMERO_FACTURA_FK, DF.NUMERO_LINEA;
/
COMMIT;

-----------------------------------------------------------------------------------
-- 10. FIDE_RESERVACIONES_CLIENTE_V
-- Vista que muestra el historial de reservaciones realizadas por cada cliente,
-- incluyendo fechas, horarios, estado y cantidad de servicios asociados.
-----------------------------------------------------------------------------------
CREATE OR REPLACE VIEW FIDE_RESERVACIONES_CLIENTE_V AS
SELECT
    U.USUARIOS_ID_CEDULA_PK                          AS "Cédula",
    U.nombre || ' ' || U.primer_apellido             AS "Cliente",
    R.RESERVACIONES_ID_RESERVACION_PK                AS "ID Reservación",
    R.fecha_reservacion                              AS "Fecha",
    R.hora_inicio                                    AS "Hora Inicio",
    R.hora_fin                                       AS "Hora Fin",
    EST.estado                                       AS "Estado",
    COUNT(DR.NUMERO_LINEA)                           AS "Cantidad de Servicios"
FROM
    G2_SC508_VT_PROYECTO.FIDE_USUARIOS_TB U
JOIN
    G2_SC508_VT_PROYECTO.FIDE_RESERVACIONES_TB R
        ON U.USUARIOS_ID_CEDULA_PK = R.USUARIOS_ID_CEDULA_PK
JOIN
    G2_SC508_VT_PROYECTO.FIDE_ESTADOS_TB EST
        ON R.ESTADOS_ID_ESTADO_PK = EST.ESTADOS_ID_ESTADO_PK
LEFT JOIN
    G2_SC508_VT_PROYECTO.FIDE_DETALLE_RESERVACION_TB DR
        ON R.RESERVACIONES_ID_RESERVACION_PK = DR.RESERVACIONES_ID_RESERVACION_PK
GROUP BY
    U.USUARIOS_ID_CEDULA_PK,
    U.nombre,
    U.primer_apellido,
    R.RESERVACIONES_ID_RESERVACION_PK,
    R.fecha_reservacion,
    R.hora_inicio,
    R.hora_fin,
    EST.estado
ORDER BY
    R.fecha_reservacion DESC;
/
COMMIT;