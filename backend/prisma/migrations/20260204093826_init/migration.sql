-- CreateEnum
CREATE TYPE "Status" AS ENUM ('pending', 'completed', 'failed');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poster_templates" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "event_type" VARCHAR(100) NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poster_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_posters" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "template_id" INTEGER NOT NULL,
    "poster_path" VARCHAR(500) NOT NULL,
    "generated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "Status" NOT NULL DEFAULT 'pending',

    CONSTRAINT "generated_posters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "poster_templates_event_type_idx" ON "poster_templates"("event_type");

-- CreateIndex
CREATE INDEX "poster_templates_is_active_idx" ON "poster_templates"("is_active");

-- CreateIndex
CREATE INDEX "generated_posters_event_id_idx" ON "generated_posters"("event_id");

-- CreateIndex
CREATE INDEX "generated_posters_template_id_idx" ON "generated_posters"("template_id");

-- CreateIndex
CREATE INDEX "generated_posters_status_idx" ON "generated_posters"("status");

-- CreateIndex
CREATE INDEX "generated_posters_generated_at_idx" ON "generated_posters"("generated_at");

-- AddForeignKey
ALTER TABLE "generated_posters" ADD CONSTRAINT "generated_posters_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "poster_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
