-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('NEW', 'NEEDS_CLIENT_INFO', 'IN_REVIEW', 'ACCEPTED', 'IN_PROGRESS', 'WAITING', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('GENERAL', 'CHANGE', 'NEW_FEATURE', 'CONTENT', 'DESIGN', 'TECHNICAL', 'QUESTION');

-- CreateEnum
CREATE TYPE "RequestSource" AS ENUM ('PORTAL', 'TELEGRAM', 'MAX', 'WHATSAPP', 'INTERNAL');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('NEW', 'READY', 'IN_PROGRESS', 'INTERNAL_REVIEW', 'CLIENT_APPROVAL', 'CHANGES_REQUIRED', 'WAITING_CLIENT', 'BLOCKED', 'APPROVED', 'DONE');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "MaterialType" AS ENUM ('FILE', 'LINK', 'TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'REFERENCE', 'SCREENSHOT', 'OTHER');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('INTERNAL', 'CLIENT');

-- CreateEnum
CREATE TYPE "MaterialVersionStatus" AS ENUM ('DRAFT', 'READY', 'SHARED', 'APPROVED', 'CHANGES_REQUIRED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "requests" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "created_by_id" UUID NOT NULL,
    "type" "RequestType" NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'NEW',
    "source" "RequestSource" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "stage_id" UUID,
    "request_id" UUID,
    "created_by_id" UUID NOT NULL,
    "assignee_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'NEW',
    "priority" "TaskPriority" NOT NULL DEFAULT 'NORMAL',
    "external_provider" TEXT,
    "external_task_id" TEXT,
    "external_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "created_by_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "MaterialType" NOT NULL,
    "visibility" "Visibility" NOT NULL DEFAULT 'INTERNAL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_versions" (
    "id" UUID NOT NULL,
    "material_id" UUID NOT NULL,
    "created_by_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "status" "MaterialVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "change_summary" TEXT,
    "previous_version_id" UUID,
    "provider" TEXT,
    "external_url" TEXT,
    "external_file_id" TEXT,
    "external_version_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "material_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "files" (
    "id" UUID NOT NULL,
    "material_version_id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "external_file_id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mime_type" TEXT,
    "size" BIGINT,
    "url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "requests_project_id_status_idx" ON "requests"("project_id", "status");

-- CreateIndex
CREATE INDEX "requests_created_by_id_idx" ON "requests"("created_by_id");

-- CreateIndex
CREATE INDEX "requests_source_idx" ON "requests"("source");

-- CreateIndex
CREATE INDEX "tasks_project_id_status_idx" ON "tasks"("project_id", "status");

-- CreateIndex
CREATE INDEX "tasks_stage_id_idx" ON "tasks"("stage_id");

-- CreateIndex
CREATE INDEX "tasks_request_id_idx" ON "tasks"("request_id");

-- CreateIndex
CREATE INDEX "tasks_assignee_id_idx" ON "tasks"("assignee_id");

-- CreateIndex
CREATE INDEX "tasks_external_provider_external_task_id_idx" ON "tasks"("external_provider", "external_task_id");

-- CreateIndex
CREATE INDEX "materials_project_id_visibility_idx" ON "materials"("project_id", "visibility");

-- CreateIndex
CREATE INDEX "materials_created_by_id_idx" ON "materials"("created_by_id");

-- CreateIndex
CREATE INDEX "material_versions_material_id_status_idx" ON "material_versions"("material_id", "status");

-- CreateIndex
CREATE INDEX "material_versions_created_by_id_idx" ON "material_versions"("created_by_id");

-- CreateIndex
CREATE INDEX "material_versions_previous_version_id_idx" ON "material_versions"("previous_version_id");

-- CreateIndex
CREATE UNIQUE INDEX "material_versions_material_id_version_number_key" ON "material_versions"("material_id", "version_number");

-- CreateIndex
CREATE INDEX "files_material_version_id_idx" ON "files"("material_version_id");

-- CreateIndex
CREATE INDEX "files_provider_external_file_id_idx" ON "files"("provider", "external_file_id");

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_versions" ADD CONSTRAINT "material_versions_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_versions" ADD CONSTRAINT "material_versions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_versions" ADD CONSTRAINT "material_versions_previous_version_id_fkey" FOREIGN KEY ("previous_version_id") REFERENCES "material_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_material_version_id_fkey" FOREIGN KEY ("material_version_id") REFERENCES "material_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
