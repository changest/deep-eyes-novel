-- CreateTable
CREATE TABLE "UserApiConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'openai',
    "apiKey" TEXT NOT NULL,
    "baseUrl" TEXT,
    "model" TEXT NOT NULL DEFAULT 'gpt-3.5-turbo',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserApiConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "UserApiConfig_userId_key" ON "UserApiConfig"("userId");

-- CreateIndex
CREATE INDEX "UserApiConfig_userId_idx" ON "UserApiConfig"("userId");
