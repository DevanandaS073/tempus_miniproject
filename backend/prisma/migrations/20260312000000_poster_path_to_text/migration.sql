-- AlterTable: expand poster_path from VARCHAR(500) to unbounded TEXT
-- so it can store the full JSON poster configuration.
ALTER TABLE "generated_posters" ALTER COLUMN "poster_path" TYPE TEXT;
