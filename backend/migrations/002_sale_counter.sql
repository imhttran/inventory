-- Counter-sale pricing: a sellable price on the product itself. The sourcing
-- rows keep wholesale cost; retail_price is what the counter charges.
ALTER TABLE products ADD COLUMN IF NOT EXISTS retail_price NUMERIC(12,2);

-- Backfill once from the preferred supplier's cost with a 60% margin, so
-- existing rows are sellable immediately. The dev seed uses the same rule.
UPDATE products p
SET retail_price = backfill.price
FROM (
    SELECT ps.product_id, ROUND(ps.cost * 1.6, 2) AS price
    FROM product_suppliers ps
    WHERE ps.preferred
) AS backfill
WHERE p.id = backfill.product_id
  AND p.retail_price IS NULL;
