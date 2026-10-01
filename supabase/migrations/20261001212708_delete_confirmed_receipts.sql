-- Receipts are deleted when the trainer confirms a payment; drop the ones already confirmed.
DELETE FROM "payment_receipts" r USING "payments" p WHERE p."id" = r."payment_id" AND p."status" = 'confirmed';
