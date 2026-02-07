/*
  Warnings:

  - Added the required column `level` to the `commands` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "commands" ADD COLUMN     "level" INTEGER NOT NULL;
