-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'BOXERA_ADMIN', 'COMMISSION_ADMIN', 'GYM_ADMIN', 'FIGHTER', 'PROMOTER', 'SPONSOR', 'COMMUNITY_MEMBER');

-- CreateEnum
CREATE TYPE "FighterStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'INACTIVE', 'RETIRED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "FightResult" AS ENUM ('WIN', 'LOSS', 'DRAW', 'NO_CONTEST');

-- CreateEnum
CREATE TYPE "FightMethod" AS ENUM ('KO', 'TKO', 'DECISION', 'TECHNICAL_DECISION', 'DQ', 'OTHER');

-- CreateEnum
CREATE TYPE "LicenseStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'SUSPENDED', 'REVOKED');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "GymStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "BenefitCategory" AS ENUM ('HEALTH', 'PHARMACY', 'LEGAL', 'TRAINING', 'BUSINESS', 'OTHER');

-- CreateEnum
CREATE TYPE "SponsorshipStatus" AS ENUM ('DISCOVERED', 'INTERESTED', 'CONTACTED', 'NEGOTIATING', 'CONFIRMED', 'LOST');

-- CreateEnum
CREATE TYPE "BoxerMembershipStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'PENDING');

-- CreateEnum
CREATE TYPE "MembershipPaymentStatus" AS ENUM ('PAID', 'PENDING', 'FAILED');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MembershipType" AS ENUM ('FAN', 'SUPPORTER', 'PARTNER');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('DISCOVERED', 'SUGGESTED', 'CONTACTING', 'NEGOTIATING', 'APPROVED', 'REJECTED', 'CONVERTED_TO_FIGHT', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OpportunitySource" AS ENUM ('PROMOTER', 'COMMISSION', 'GYM', 'FIGHTER', 'BOXXERA', 'ALGORITHM');

-- CreateEnum
CREATE TYPE "FightStatus" AS ENUM ('DRAFT', 'NEGOTIATING', 'PENDING_COMMISSION', 'PENDING_MEDICAL', 'PENDING_CONTRACT', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EventOwner" AS ENUM ('EXTERNAL_PROMOTER', 'BOXXERA', 'CO_PRODUCED');

-- CreateEnum
CREATE TYPE "EventCostCategory" AS ENUM ('FIGHTER_PURSE', 'VENUE', 'COMMISSION', 'MEDICAL', 'PRODUCTION', 'SECURITY', 'TRAVEL', 'HOTEL', 'MARKETING', 'INSURANCE', 'STAFF', 'EQUIPMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "EventRevenueCategory" AS ENUM ('TICKETS', 'SPONSORSHIP', 'STREAMING', 'PPV', 'HOSPITALITY', 'ACTIVATION', 'MERCHANDISING', 'MEDIA', 'OTHER');

-- CreateEnum
CREATE TYPE "DataConfidence" AS ENUM ('CONFIRMED', 'ESTIMATED', 'ASSUMED', 'PROPOSED');

-- CreateEnum
CREATE TYPE "LineItemStatus" AS ENUM ('PLANNED', 'PENDING', 'PAID', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SupportRequestType" AS ENUM ('ORIENTACION_MEDICA', 'LESION', 'ESTUDIO', 'MEDICAMENTO', 'ORIENTACION_LEGAL', 'DUDA_CONTRATO', 'DUDA_LICENCIA', 'AYUDA_PELEA');

-- CreateTable
CREATE TABLE "Country" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "countryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'COMMUNITY_MEMBER',
    "commissionId" TEXT,
    "gymId" TEXT,
    "fighterId" TEXT,
    "sponsorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "cityId" TEXT NOT NULL,
    "jurisdiction" TEXT,
    "status" "CommissionStatus" NOT NULL DEFAULT 'ACTIVE',
    "logoUrl" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Commission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gym" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "headCoach" TEXT,
    "responsibleName" TEXT,
    "description" TEXT,
    "photoUrl" TEXT,
    "status" "GymStatus" NOT NULL DEFAULT 'ACTIVE',
    "commissionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gym_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FighterGymHistory" (
    "id" TEXT NOT NULL,
    "fighterId" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "current" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "FighterGymHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fighter" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "publicName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "nationality" TEXT,
    "cityId" TEXT,
    "gender" "Gender" NOT NULL,
    "weightClass" TEXT NOT NULL,
    "photoUrl" TEXT,
    "bio" TEXT,
    "status" "FighterStatus" NOT NULL DEFAULT 'PENDING',
    "commissionId" TEXT,
    "gymId" TEXT,
    "coachName" TEXT,
    "licenseNumber" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "koWins" INTEGER NOT NULL DEFAULT 0,
    "totalFights" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fighter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FightRecord" (
    "id" TEXT NOT NULL,
    "fighterId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "opponentName" TEXT NOT NULL,
    "result" "FightResult" NOT NULL,
    "method" "FightMethod" NOT NULL,
    "round" INTEGER,
    "decisionNote" TEXT,
    "venue" TEXT,
    "city" TEXT,
    "country" TEXT,
    "eventName" TEXT,
    "commissionId" TEXT,
    "notes" TEXT,
    "source" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FightRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "License" (
    "id" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "fighterId" TEXT NOT NULL,
    "commissionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "status" "LicenseStatus" NOT NULL DEFAULT 'PENDING',
    "documentUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "License_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ranking" (
    "id" TEXT NOT NULL,
    "commissionId" TEXT,
    "weightClass" TEXT NOT NULL,
    "region" TEXT,
    "period" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ranking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RankingEntry" (
    "id" TEXT NOT NULL,
    "rankingId" TEXT NOT NULL,
    "fighterId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "points" INTEGER,
    "status" TEXT,
    "notes" TEXT,

    CONSTRAINT "RankingEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "notes" TEXT,
    "userId" TEXT,
    "fighterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Benefit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "BenefitCategory" NOT NULL,
    "description" TEXT,
    "providerName" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "eligibilityRules" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Benefit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FighterBenefit" (
    "id" TEXT NOT NULL,
    "fighterId" TEXT NOT NULL,
    "benefitId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "FighterBenefit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "membershipStatus" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "membershipType" "MembershipType" NOT NULL DEFAULT 'FAN',
    "city" TEXT,
    "country" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sponsor" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "industry" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sponsor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sponsorship" (
    "id" TEXT NOT NULL,
    "sponsorId" TEXT NOT NULL,
    "program" TEXT NOT NULL,
    "fighterId" TEXT,
    "eventId" TEXT,
    "proposedAmount" DECIMAL(12,2),
    "confirmedAmount" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'MXN',
    "benefits" TEXT,
    "responsibleId" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "SponsorshipStatus" NOT NULL DEFAULT 'DISCOVERED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sponsorship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoxerMembership" (
    "id" TEXT NOT NULL,
    "fighterId" TEXT NOT NULL,
    "status" "BoxerMembershipStatus" NOT NULL DEFAULT 'PENDING',
    "monthlyPrice" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MXN',
    "startDate" TIMESTAMP(3),
    "renewalDate" TIMESTAMP(3),
    "lastPaymentDate" TIMESTAMP(3),
    "paymentStatus" "MembershipPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoxerMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "city" TEXT NOT NULL,
    "venue" TEXT,
    "commissionId" TEXT,
    "promoterName" TEXT,
    "promoterId" TEXT,
    "status" "EventStatus" NOT NULL DEFAULT 'SCHEDULED',
    "capacity" INTEGER,
    "expectedAttendance" INTEGER,
    "eventOwner" "EventOwner" NOT NULL DEFAULT 'EXTERNAL_PROMOTER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fight" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "fighterAId" TEXT NOT NULL,
    "fighterBId" TEXT NOT NULL,
    "weightClass" TEXT NOT NULL,
    "result" "FightResult",
    "method" "FightMethod",
    "round" INTEGER,
    "status" "FightStatus" NOT NULL DEFAULT 'DRAFT',
    "purseA" DECIMAL(12,2),
    "purseB" DECIMAL(12,2),
    "purseCurrency" TEXT NOT NULL DEFAULT 'MXN',
    "commissionStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "medicalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "contractStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "opportunityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FightOpportunity" (
    "id" TEXT NOT NULL,
    "fighterAId" TEXT NOT NULL,
    "fighterBId" TEXT NOT NULL,
    "weightClass" TEXT NOT NULL,
    "proposedDate" TIMESTAMP(3),
    "proposedCity" TEXT,
    "proposedVenue" TEXT,
    "commissionId" TEXT,
    "source" "OpportunitySource" NOT NULL DEFAULT 'BOXXERA',
    "createdById" TEXT,
    "status" "OpportunityStatus" NOT NULL DEFAULT 'DISCOVERED',
    "sportingScore" INTEGER,
    "commercialScore" INTEGER,
    "logisticsScore" INTEGER,
    "economicScore" INTEGER,
    "totalScore" INTEGER,
    "explanation" JSONB,
    "dataConfidence" "DataConfidence" NOT NULL DEFAULT 'ASSUMED',
    "estimatedCost" DECIMAL(12,2),
    "estimatedRevenue" DECIMAL(12,2),
    "estimatedProfit" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'MXN',
    "eventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FightOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpportunityVote" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "voterKey" TEXT NOT NULL,
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpportunityVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventCost" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "category" "EventCostCategory" NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MXN',
    "vendor" TEXT,
    "confidence" "DataConfidence" NOT NULL DEFAULT 'ESTIMATED',
    "status" "LineItemStatus" NOT NULL DEFAULT 'PLANNED',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventCost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventRevenue" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "category" "EventRevenueCategory" NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MXN',
    "source" TEXT,
    "confidence" "DataConfidence" NOT NULL DEFAULT 'ESTIMATED',
    "status" "LineItemStatus" NOT NULL DEFAULT 'PLANNED',
    "receivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventRevenue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "requestType" "SupportRequestType",
    "status" "TaskStatus" NOT NULL DEFAULT 'OPEN',
    "assignedToId" TEXT,
    "opportunityId" TEXT,
    "fightId" TEXT,
    "eventId" TEXT,
    "fighterId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Country_code_key" ON "Country"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Region_countryId_name_key" ON "Region"("countryId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "City_regionId_name_key" ON "City"("regionId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_fighterId_key" ON "User"("fighterId");

-- CreateIndex
CREATE UNIQUE INDEX "User_sponsorId_key" ON "User"("sponsorId");

-- CreateIndex
CREATE UNIQUE INDEX "Fighter_slug_key" ON "Fighter"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "License_licenseNumber_key" ON "License"("licenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "RankingEntry_rankingId_fighterId_key" ON "RankingEntry"("rankingId", "fighterId");

-- CreateIndex
CREATE UNIQUE INDEX "FighterBenefit_fighterId_benefitId_key" ON "FighterBenefit"("fighterId", "benefitId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityMember_userId_key" ON "CommunityMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BoxerMembership_fighterId_key" ON "BoxerMembership"("fighterId");

-- CreateIndex
CREATE UNIQUE INDEX "Fight_opportunityId_key" ON "Fight"("opportunityId");

-- CreateIndex
CREATE UNIQUE INDEX "OpportunityVote_opportunityId_voterKey_key" ON "OpportunityVote"("opportunityId", "voterKey");

-- CreateIndex
CREATE INDEX "Fighter_status_idx" ON "Fighter"("status");

-- CreateIndex
CREATE INDEX "Fighter_verificationStatus_idx" ON "Fighter"("verificationStatus");

-- CreateIndex
CREATE INDEX "FightRecord_fighterId_idx" ON "FightRecord"("fighterId");

-- CreateIndex
CREATE INDEX "License_status_idx" ON "License"("status");

-- CreateIndex
CREATE INDEX "License_expiresAt_idx" ON "License"("expiresAt");

-- CreateIndex
CREATE INDEX "FightOpportunity_status_idx" ON "FightOpportunity"("status");

-- CreateIndex
CREATE INDEX "FightOpportunity_fighterAId_idx" ON "FightOpportunity"("fighterAId");

-- CreateIndex
CREATE INDEX "FightOpportunity_fighterBId_idx" ON "FightOpportunity"("fighterBId");

-- CreateIndex
CREATE INDEX "OpportunityVote_opportunityId_idx" ON "OpportunityVote"("opportunityId");

-- CreateIndex
CREATE INDEX "EventCost_eventId_idx" ON "EventCost"("eventId");

-- CreateIndex
CREATE INDEX "EventRevenue_eventId_idx" ON "EventRevenue"("eventId");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Region" ADD CONSTRAINT "Region_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "City" ADD CONSTRAINT "City_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_commissionId_fkey" FOREIGN KEY ("commissionId") REFERENCES "Commission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_fighterId_fkey" FOREIGN KEY ("fighterId") REFERENCES "Fighter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "Sponsor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gym" ADD CONSTRAINT "Gym_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gym" ADD CONSTRAINT "Gym_commissionId_fkey" FOREIGN KEY ("commissionId") REFERENCES "Commission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FighterGymHistory" ADD CONSTRAINT "FighterGymHistory_fighterId_fkey" FOREIGN KEY ("fighterId") REFERENCES "Fighter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FighterGymHistory" ADD CONSTRAINT "FighterGymHistory_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fighter" ADD CONSTRAINT "Fighter_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fighter" ADD CONSTRAINT "Fighter_commissionId_fkey" FOREIGN KEY ("commissionId") REFERENCES "Commission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fighter" ADD CONSTRAINT "Fighter_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FightRecord" ADD CONSTRAINT "FightRecord_fighterId_fkey" FOREIGN KEY ("fighterId") REFERENCES "Fighter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FightRecord" ADD CONSTRAINT "FightRecord_commissionId_fkey" FOREIGN KEY ("commissionId") REFERENCES "Commission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "License" ADD CONSTRAINT "License_fighterId_fkey" FOREIGN KEY ("fighterId") REFERENCES "Fighter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "License" ADD CONSTRAINT "License_commissionId_fkey" FOREIGN KEY ("commissionId") REFERENCES "Commission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ranking" ADD CONSTRAINT "Ranking_commissionId_fkey" FOREIGN KEY ("commissionId") REFERENCES "Commission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankingEntry" ADD CONSTRAINT "RankingEntry_rankingId_fkey" FOREIGN KEY ("rankingId") REFERENCES "Ranking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankingEntry" ADD CONSTRAINT "RankingEntry_fighterId_fkey" FOREIGN KEY ("fighterId") REFERENCES "Fighter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationLog" ADD CONSTRAINT "VerificationLog_fighterId_fkey" FOREIGN KEY ("fighterId") REFERENCES "Fighter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FighterBenefit" ADD CONSTRAINT "FighterBenefit_fighterId_fkey" FOREIGN KEY ("fighterId") REFERENCES "Fighter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FighterBenefit" ADD CONSTRAINT "FighterBenefit_benefitId_fkey" FOREIGN KEY ("benefitId") REFERENCES "Benefit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityMember" ADD CONSTRAINT "CommunityMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sponsorship" ADD CONSTRAINT "Sponsorship_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "Sponsor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sponsorship" ADD CONSTRAINT "Sponsorship_fighterId_fkey" FOREIGN KEY ("fighterId") REFERENCES "Fighter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sponsorship" ADD CONSTRAINT "Sponsorship_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sponsorship" ADD CONSTRAINT "Sponsorship_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoxerMembership" ADD CONSTRAINT "BoxerMembership_fighterId_fkey" FOREIGN KEY ("fighterId") REFERENCES "Fighter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_commissionId_fkey" FOREIGN KEY ("commissionId") REFERENCES "Commission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_promoterId_fkey" FOREIGN KEY ("promoterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fight" ADD CONSTRAINT "Fight_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fight" ADD CONSTRAINT "Fight_fighterAId_fkey" FOREIGN KEY ("fighterAId") REFERENCES "Fighter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fight" ADD CONSTRAINT "Fight_fighterBId_fkey" FOREIGN KEY ("fighterBId") REFERENCES "Fighter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fight" ADD CONSTRAINT "Fight_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "FightOpportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FightOpportunity" ADD CONSTRAINT "FightOpportunity_fighterAId_fkey" FOREIGN KEY ("fighterAId") REFERENCES "Fighter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FightOpportunity" ADD CONSTRAINT "FightOpportunity_fighterBId_fkey" FOREIGN KEY ("fighterBId") REFERENCES "Fighter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FightOpportunity" ADD CONSTRAINT "FightOpportunity_commissionId_fkey" FOREIGN KEY ("commissionId") REFERENCES "Commission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FightOpportunity" ADD CONSTRAINT "FightOpportunity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FightOpportunity" ADD CONSTRAINT "FightOpportunity_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityVote" ADD CONSTRAINT "OpportunityVote_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "FightOpportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventCost" ADD CONSTRAINT "EventCost_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRevenue" ADD CONSTRAINT "EventRevenue_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "FightOpportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_fightId_fkey" FOREIGN KEY ("fightId") REFERENCES "Fight"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_fighterId_fkey" FOREIGN KEY ("fighterId") REFERENCES "Fighter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
