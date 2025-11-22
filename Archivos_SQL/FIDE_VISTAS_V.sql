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
