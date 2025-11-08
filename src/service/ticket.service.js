

export function buyTicketService(event_seat_id, attendee_id) {
    // 1. Obtener el asiento del evento (event_seat) + su evento
    //    - traer event_seat por id
    //    - join al event para saber su estado y fecha/hora

    // 2. Validar que el evento esté en fase de venta (event.status = 'on_sale')
    //    - si no, cortar

    // 3. Validar que el asiento pertenece a ese evento y que NO esté vendido/bloqueado
    //    - revisar event_seat_status: debe ser 'available' o 'reserved' PARA este usuario

    // 4. Buscar si existe una reserva para este event_seat
    //    - reservation WHERE event_seat_id = ? AND status = 'active'
    //    - puede no existir (compra directa) o sí existir

    // 5. Si existe reserva:
    //    5.1 validar que no esté expirada (expiration_at > now)
    //    5.2 validar que el attendee_id de la reserva sea el mismo que quiere comprar
    //    5.3 opcional: validar que el asiento esté en estado 'reserved'
    //    si falla algo de esto → no dejar comprar

    // 6. Si NO existe reserva:
    //    - (opcional según tu flujo) crear una reserva rápida para este attendee y asiento
    //    - marcar asiento como 'reserved'
    //    Esto asegura que mientras cobras nadie más se lo lleva.

    // 7. Calcular montos a cobrar
    //    - base_price = event_seat.base_price
    //    - tax_percentage según tu lógica
    //    - tax_amount y total_amount
    //    Esto es lo que vas a guardar en payment como snapshot.

    // 8. Obtener/validar el método de pago del attendee
    //    - que exista un payment_method asociado al attendee
    //    - que esté activo
    //    (o traer el token que te pasen en la petición)

    // 9. Intentar realizar el cobro en el PSP (Stripe, etc.)
    //    - si el cobro falla → retornar error y (opcional) liberar la reserva si la creaste aquí
    //    - si el cobro pasa → seguir

    // 10. Crear el registro de payment
    //     - attendee_id
    //     - payment_method_id
    //     - reservation_id (si la había)
    //     - subtotal, tax_percentage, tax_amount, total_amount
    //     - ticket_quantity = 1

    // 11. Actualizar la reserva (si existía) a status = 'converted'
    //     - esto cierra el ciclo de la reserva
    //     - también puedes actualizar event_seat_status a 'sold'

    // 12. Crear el ticket
    //     - payment_id
    //     - event_seat_id
    //     - seat_label (Row X Seat Y) derivado de seat
    //     - category_label (VIP / General) derivado de section
    //     - unit_price = el que se cobró
    //     - ticket_status = 'sold'
    //     - qr_code generado

    // 13. Marcar el event_seat como 'sold'
    //     - importante hacerlo aquí para que no se revenda

    // 14. Retornar info del ticket / pago
    //     - para que el frontend lo muestre o lo mande por correo
}