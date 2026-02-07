/*
  Warnings:

  - Added the required column `cooldown` to the `commands` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "commands" ADD COLUMN     "cooldown" INTEGER NOT NULL;
