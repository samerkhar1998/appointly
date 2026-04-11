-- CreateEnum
CREATE TYPE "GlobalRole" AS ENUM ('CUSTOMER', 'SALON_OWNER', 'PLATFORM_ADMIN');

-- CreateEnum
CREATE TYPE "SalonRole" AS ENUM ('OWNER', 'MANAGER', 'STAFF');

-- CreateEnum
CREATE TYPE "ConfirmationMode" AS ENUM ('MANUAL', 'AUTO');

-- CreateEnum
CREATE TYPE "CancellationMethod" AS ENUM ('MAGIC_LINK', 'PHONE_OTP');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "CancelledBy" AS ENUM ('CUSTOMER', 'OWNER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "Fulfillment" AS ENUM ('PICKUP', 'DELIVERY', 'BOTH');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'READY', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PromoType" AS ENUM ('PERCENTAGE', 'FIXED', 'FREE_SERVICE', 'FREE_PRODUCT');

-- CreateEnum
CREATE TYPE "PromoAppliesTo" AS ENUM ('BOOKINGS', 'PRODUCTS', 'BOTH');

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "price_monthly" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "price_yearly" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "max_staff" INTEGER NOT NULL DEFAULT 1,
    "max_services" INTEGER NOT NULL DEFAULT 5,
    "max_monthly_bookings" INTEGER NOT NULL DEFAULT 50,
    "allow_products" BOOLEAN NOT NULL DEFAULT false,
    "allow_promos" BOOLEAN NOT NULL DEFAULT false,
    "allow_analytics" BOOLEAN NOT NULL DEFAULT false,
    "allow_multi_staff" BOOLEAN NOT NULL DEFAULT false,
    "allow_custom_wa" BOOLEAN NOT NULL DEFAULT false,
    "allow_api_access" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "name" TEXT NOT NULL,
    "password_hash" TEXT,
    "google_id" TEXT,
    "global_role" "GlobalRole" NOT NULL DEFAULT 'CUSTOMER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Salon" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Jerusalem',
    "logo_url" TEXT,
    "cover_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "plan_id" TEXT NOT NULL,

    CONSTRAINT "Salon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalonSettings" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "salon_id" TEXT NOT NULL,
    "confirmation_mode" "ConfirmationMode" NOT NULL DEFAULT 'AUTO',
    "cancellation_method" "CancellationMethod" NOT NULL DEFAULT 'MAGIC_LINK',
    "cancellation_window_hours" INTEGER NOT NULL DEFAULT 24,
    "wa_phone_number" TEXT,
    "wa_confirmation_template" TEXT,
    "wa_reminder_template" TEXT,
    "wa_post_visit_template" TEXT,
    "booking_slot_interval_mins" INTEGER NOT NULL DEFAULT 15,
    "buffer_after_mins" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SalonSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalonHours" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "salon_id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "open_time" TEXT NOT NULL,
    "close_time" TEXT NOT NULL,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SalonHours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalonMember" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,
    "salon_id" TEXT NOT NULL,
    "role" "SalonRole" NOT NULL DEFAULT 'STAFF',
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SalonMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "salon_member_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "bio" TEXT,
    "avatar_url" TEXT,
    "is_bookable" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffSchedule" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "staff_id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "is_working" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "StaffSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffBlockedTime" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "staff_id" TEXT NOT NULL,
    "start_datetime" TIMESTAMP(3) NOT NULL,
    "end_datetime" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,

    CONSTRAINT "StaffBlockedTime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "salon_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "salon_id" TEXT NOT NULL,
    "category_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "duration_mins" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ILS',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhoneVerification" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "phone_number" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "verification_token" TEXT,
    "token_used" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PhoneVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalonClient" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "salon_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "client_token" TEXT NOT NULL,
    "total_visits" INTEGER NOT NULL DEFAULT 0,
    "last_visit_at" TIMESTAMP(3),
    "notes" TEXT,
    "is_blocked" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "SalonClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "salon_id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "salon_client_id" TEXT,
    "customer_name" TEXT NOT NULL,
    "customer_phone" TEXT NOT NULL,
    "customer_email" TEXT,
    "start_datetime" TIMESTAMP(3) NOT NULL,
    "end_datetime" TIMESTAMP(3) NOT NULL,
    "buffer_after_mins" INTEGER NOT NULL DEFAULT 0,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "cancel_token" TEXT NOT NULL,
    "cancel_token_used" BOOLEAN NOT NULL DEFAULT false,
    "cancelled_by" "CancelledBy",
    "cancellation_reason" TEXT,
    "reminder_24h_sent" BOOLEAN NOT NULL DEFAULT false,
    "reminder_1h_sent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "salon_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category_name" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ILS',
    "stock_quantity" INTEGER,
    "low_stock_alert_at" INTEGER,
    "fulfillment" "Fulfillment" NOT NULL DEFAULT 'PICKUP',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "photos" TEXT[],

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "salon_id" TEXT NOT NULL,
    "salon_client_id" TEXT NOT NULL,
    "appointment_id" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "fulfillment_type" "Fulfillment" NOT NULL DEFAULT 'PICKUP',
    "delivery_address" TEXT,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "service_total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "grand_total" DECIMAL(10,2) NOT NULL,
    "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "final_total" DECIMAL(10,2) NOT NULL,
    "promo_code_id" TEXT,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoCode" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "salon_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "PromoType" NOT NULL,
    "value" DECIMAL(10,2),
    "free_service_id" TEXT,
    "free_product_id" TEXT,
    "applies_to" "PromoAppliesTo" NOT NULL DEFAULT 'BOTH',
    "min_spend" DECIMAL(10,2),
    "valid_from" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),
    "max_uses_total" INTEGER,
    "max_uses_per_client" INTEGER,
    "first_time_only" BOOLEAN NOT NULL DEFAULT false,
    "salon_client_id" TEXT,
    "times_used" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoUsage" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "promo_code_id" TEXT NOT NULL,
    "salon_client_id" TEXT NOT NULL,
    "order_id" TEXT,
    "appointment_id" TEXT,
    "discount_applied" DECIMAL(10,2) NOT NULL,
    "used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromoUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "appointment_id" TEXT NOT NULL,
    "salon_client_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Plan_name_key" ON "Plan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_google_id_key" ON "User"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "Salon_slug_key" ON "Salon"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "SalonSettings_salon_id_key" ON "SalonSettings"("salon_id");

-- CreateIndex
CREATE UNIQUE INDEX "SalonHours_salon_id_day_of_week_key" ON "SalonHours"("salon_id", "day_of_week");

-- CreateIndex
CREATE UNIQUE INDEX "SalonMember_user_id_salon_id_key" ON "SalonMember"("user_id", "salon_id");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_salon_member_id_key" ON "Staff"("salon_member_id");

-- CreateIndex
CREATE UNIQUE INDEX "StaffSchedule_staff_id_day_of_week_key" ON "StaffSchedule"("staff_id", "day_of_week");

-- CreateIndex
CREATE UNIQUE INDEX "Category_salon_id_name_key" ON "Category"("salon_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "PhoneVerification_verification_token_key" ON "PhoneVerification"("verification_token");

-- CreateIndex
CREATE INDEX "PhoneVerification_phone_number_idx" ON "PhoneVerification"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "SalonClient_client_token_key" ON "SalonClient"("client_token");

-- CreateIndex
CREATE INDEX "SalonClient_salon_id_phone_idx" ON "SalonClient"("salon_id", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "SalonClient_salon_id_phone_key" ON "SalonClient"("salon_id", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_cancel_token_key" ON "Appointment"("cancel_token");

-- CreateIndex
CREATE INDEX "Appointment_salon_id_start_datetime_idx" ON "Appointment"("salon_id", "start_datetime");

-- CreateIndex
CREATE INDEX "Appointment_staff_id_start_datetime_idx" ON "Appointment"("staff_id", "start_datetime");

-- CreateIndex
CREATE INDEX "Appointment_cancel_token_idx" ON "Appointment"("cancel_token");

-- CreateIndex
CREATE UNIQUE INDEX "Order_appointment_id_key" ON "Order"("appointment_id");

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_salon_id_code_key" ON "PromoCode"("salon_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Review_appointment_id_key" ON "Review"("appointment_id");

-- AddForeignKey
ALTER TABLE "Salon" ADD CONSTRAINT "Salon_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalonSettings" ADD CONSTRAINT "SalonSettings_salon_id_fkey" FOREIGN KEY ("salon_id") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalonHours" ADD CONSTRAINT "SalonHours_salon_id_fkey" FOREIGN KEY ("salon_id") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalonMember" ADD CONSTRAINT "SalonMember_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalonMember" ADD CONSTRAINT "SalonMember_salon_id_fkey" FOREIGN KEY ("salon_id") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_salon_member_id_fkey" FOREIGN KEY ("salon_member_id") REFERENCES "SalonMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffSchedule" ADD CONSTRAINT "StaffSchedule_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffBlockedTime" ADD CONSTRAINT "StaffBlockedTime_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_salon_id_fkey" FOREIGN KEY ("salon_id") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_salon_id_fkey" FOREIGN KEY ("salon_id") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalonClient" ADD CONSTRAINT "SalonClient_salon_id_fkey" FOREIGN KEY ("salon_id") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_salon_id_fkey" FOREIGN KEY ("salon_id") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_salon_client_id_fkey" FOREIGN KEY ("salon_client_id") REFERENCES "SalonClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_salon_id_fkey" FOREIGN KEY ("salon_id") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_salon_id_fkey" FOREIGN KEY ("salon_id") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_salon_client_id_fkey" FOREIGN KEY ("salon_client_id") REFERENCES "SalonClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_promo_code_id_fkey" FOREIGN KEY ("promo_code_id") REFERENCES "PromoCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCode" ADD CONSTRAINT "PromoCode_salon_id_fkey" FOREIGN KEY ("salon_id") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCode" ADD CONSTRAINT "PromoCode_free_service_id_fkey" FOREIGN KEY ("free_service_id") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCode" ADD CONSTRAINT "PromoCode_free_product_id_fkey" FOREIGN KEY ("free_product_id") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCode" ADD CONSTRAINT "PromoCode_salon_client_id_fkey" FOREIGN KEY ("salon_client_id") REFERENCES "SalonClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoUsage" ADD CONSTRAINT "PromoUsage_promo_code_id_fkey" FOREIGN KEY ("promo_code_id") REFERENCES "PromoCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoUsage" ADD CONSTRAINT "PromoUsage_salon_client_id_fkey" FOREIGN KEY ("salon_client_id") REFERENCES "SalonClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoUsage" ADD CONSTRAINT "PromoUsage_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoUsage" ADD CONSTRAINT "PromoUsage_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_salon_client_id_fkey" FOREIGN KEY ("salon_client_id") REFERENCES "SalonClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
