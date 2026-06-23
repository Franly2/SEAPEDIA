/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-misused-promises */
import { PrismaClient, Role, OrderStatus, DeliveryMethod, TransactionType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Menghapus data lama...');
  await prisma.deliveryJob.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.walletTransaction.deleteMany();
  await prisma.product.deleteMany();
  await prisma.store.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();
  await prisma.voucher.deleteMany();
  await prisma.promo.deleteMany();
  await prisma.appReview.deleteMany();

  console.log('Mulai seeding data ...');

  const salt = await bcrypt.genSalt(10);
  const DEFAULT_PASSWORD_HASH = await bcrypt.hash('password123', salt);

  // 1. AppReview (5 data)
  for (let i = 1; i <= 5; i++) {
    await prisma.appReview.create({
      data: {
        reviewerName: `Pengguna Testimonial ${i}`,
        rating: i === 5 ? 5 : 4,
        comment: `Aplikasi SEAPEDIA sangat bagus dan membantu! (Review ${i})`,
      },
    });
  }

  const nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
  const lastYear = new Date(new Date().setFullYear(new Date().getFullYear() - 1));

  // --- VOUCHER ---
  const vouchers = [
    { id: '55555555-5555-5555-5555-555555555551', code: 'VOUCHER_AKTIF', discountValue: 10000, usageQuota: 100, expiryDate: nextYear },
    { id: '55555555-5555-5555-5555-555555555552', code: 'VOUCHER_HABIS', discountValue: 15000, usageQuota: 0, expiryDate: nextYear }, // Kuota habis (Simulasi Gagal)
    { id: '55555555-5555-5555-5555-555555555553', code: 'VOUCHER_KADALUARSA', discountValue: 20000, usageQuota: 50, expiryDate: lastYear }, // Expired (Simulasi Gagal)
    { id: '55555555-5555-5555-5555-555555555554', code: 'VOUCHER_CEPEK', discountValue: 100000, usageQuota: 5, expiryDate: nextYear },
    { id: '55555555-5555-5555-5555-555555555555', code: 'VOUCHER_GOCENG', discountValue: 5000, usageQuota: 500, expiryDate: nextYear },
  ];

  for (const v of vouchers) {
    await prisma.voucher.create({ data: v });
  }

  // --- PROMO ---
  const promos = [
    { id: '66666666-6666-6666-6666-666666666661', code: 'PROMO_AKTIF', discountValue: 5000, expiryDate: nextYear },
    { id: '66666666-6666-6666-6666-666666666662', code: 'PROMO_KADALUARSA', discountValue: 10000, expiryDate: lastYear }, // Expired (Simulasi Gagal)
    { id: '66666666-6666-6666-6666-666666666663', code: 'PROMO_ONKIR', discountValue: 15000, expiryDate: nextYear },
    { id: '66666666-6666-6666-6666-666666666664', code: 'PROMO_MERDEKA', discountValue: 17000, expiryDate: nextYear },
    { id: '66666666-6666-6666-6666-666666666665', code: 'PROMO_TAHUNBARU', discountValue: 25000, expiryDate: nextYear },
  ];

  for (const p of promos) {
    await prisma.promo.create({ data: p });
  }

  // 3. User (5 data multi-role agar bisa jadi Buyer, Seller, dan Driver)
  const users = [];
  for (let i = 1; i <= 5; i++) {
    const user = await prisma.user.create({
      data: {
        id: `11111111-1111-1111-1111-11111111111${i}`,
        username: `user_tester_${i}`,
        password: DEFAULT_PASSWORD_HASH,
        fullName: `Akun Tester ${i}`,
        roles: [Role.BUYER, Role.SELLER, Role.DRIVER, Role.ADMIN], 
        walletBalance: 500000, 
      },
    });
    users.push(user);
  }

  // 4. Store & Address (Masing-masing 5 data, berelasi dengan User)
  for (let i = 1; i <= 5; i++) {
    await prisma.store.create({
      data: {
        id: `22222222-2222-2222-2222-22222222222${i}`,
        name: `Toko Serba Ada ${i}`,
        ownerId: `11111111-1111-1111-1111-11111111111${i}`,
      },
    });

    await prisma.address.create({
      data: {
        id: `44444444-4444-4444-4444-44444444444${i}`,
        userId: `11111111-1111-1111-1111-11111111111${i}`,
        label: `Rumah ${i}`,
        addressLine: `Jalan Mawar Merah No. ${i}, Surabaya`,
      },
    });
  }

  // 5. Product (5 data, berelasi dengan Store)
  for (let i = 1; i <= 5; i++) {
    await prisma.product.create({
      data: {
        id: `33333333-3333-3333-3333-33333333333${i}`,
        name: `Produk Andalan Toko ${i}`,
        description: `Ini adalah deskripsi produk unggulan dari toko ${i}.`,
        price: i * 50000,
        stock: 100,
        storeId: `22222222-2222-2222-2222-22222222222${i}`,
        imageUrl: `https://picsum.photos/id/${10 + i}/400/400`,
      },
    });
  }

  // 6. WalletTransaction (5 data, top up awal)
  for (let i = 1; i <= 5; i++) {
    await prisma.walletTransaction.create({
      data: {
        userId: `11111111-1111-1111-1111-11111111111${i}`,
        amount: 500000,
        type: TransactionType.TOP_UP,
        description: `Top Up Awal Saldo Akun ${i}`,
      },
    });
  }

  // 7. CartItem (5 data: User 1 memasukkan produk dari Toko 2, User 2 -> Toko 3, dst.)
  for (let i = 1; i <= 5; i++) {
    const targetProductIndex = i === 5 ? 1 : i + 1; // User 5 beli produk 1
    await prisma.cartItem.create({
      data: {
        userId: `11111111-1111-1111-1111-11111111111${i}`,
        productId: `33333333-3333-3333-3333-33333333333${targetProductIndex}`,
        quantity: 2,
      },
    });
  }

  // 8. Order, OrderItem, StatusHistory, dan DeliveryJob (Masing-masing 5 data)
  for (let i = 1; i <= 5; i++) {
    const buyerId = `11111111-1111-1111-1111-11111111111${i}`;
    const targetStoreIndex = i === 5 ? 1 : i + 1;
    const storeId = `22222222-2222-2222-2222-22222222222${targetStoreIndex}`;
    const productId = `33333333-3333-3333-3333-33333333333${targetStoreIndex}`;
    const driverId = `11111111-1111-1111-1111-11111111111${i === 1 ? 5 : i - 1}`; // Driver diambil menyilang

    const orderId = `77777777-7777-7777-7777-77777777777${i}`;

    // Buat Order
    await prisma.order.create({
      data: {
        id: orderId,
        buyerId: buyerId,
        storeId: storeId,
        addressId: `44444444-4444-4444-4444-44444444444${i}`,
        subtotal: targetStoreIndex * 50000 * 2, // Harga produk * quantity
        discountAmount: 10000,
        deliveryFee: 15000,
        ppnAmount: ((targetStoreIndex * 50000 * 2) * 12) / 100, // PPN 12%
        finalTotal: (targetStoreIndex * 50000 * 2) - 10000 + 15000 + (((targetStoreIndex * 50000 * 2) * 12) / 100),
        deliveryMethod: DeliveryMethod.REGULAR,
        status: OrderStatus.SEDANG_DIKIRIM, // status sedang dikirim agar relasi DeliveryJob valid
        voucherId: `55555555-5555-5555-5555-55555555555${i}`,
      },
    });

    // Buat Order Item
    await prisma.orderItem.create({
      data: {
        orderId: orderId,
        productId: productId,
        quantity: 2,
        priceAtBuy: targetStoreIndex * 50000,
      },
    });

    // Buat Status History
    await prisma.orderStatusHistory.create({
      data: {
        orderId: orderId,
        status: OrderStatus.SEDANG_DIKIRIM,
      },
    });

    // Buat Delivery Job
    await prisma.deliveryJob.create({
      data: {
        orderId: orderId,
        driverId: driverId,
        driverFee: 10000, 
        takenAt: new Date(),
      },
    });
  }

  console.log('Seeding berhasil.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });