/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable prettier/prettier */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { ClusterRequest } from './dto/cluster.dto';

@Injectable()
export class VrpService {
    constructor(private readonly prisma: PrismaService) {}
    async getOptimizedRoute(lat: number, lng: number) {
        const targets = [
        { id: 'A', latitude: lat + 0.003, longitude: lng + 0.003, title: 'Paket A' },
        { id: 'B', latitude: lat - 0.004, longitude: lng + 0.002, title: 'Paket B' }
        ];

        const coordinates = `${lng},${lat};${targets[0].longitude},${targets[0].latitude};${targets[1].longitude},${targets[1].latitude}`;
        const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;

        const response = await fetch(url);
        const data = await response.json();

        const routeCoords = data.routes[0].geometry.coordinates.map((point: number[]) => ({
        latitude: point[1],
        longitude: point[0],
        }));

        return {
        distance: data.routes[0].distance,
        duration: data.routes[0].duration,
        coords: routeCoords,
        targets: targets, // Kirim daftar paket juga buat ditampilin di frontend
        };
    } 

    // Fungsi untuk generate payload testing
  async generateTestPayload() {
  // 0. Ambil Perusahaan Pertama (Katering Ibu Budi)
  const testCompany = await this.prisma.company.findFirst({
    include: {
      depots: true, // Ambil juga data depot yang tersambung ke company ini
    }
  });

  if (!testCompany) {
    throw new Error('Belum ada data Perusahaan. Jalankan npx prisma db seed dulu!');
  }

  // Ambil Depot pertama milik perusahaan tersebut
  const companyDepot = testCompany.depots[0];
  if (!companyDepot) {
    throw new Error('Depot tidak ditemukan untuk perusahaan ini. Cek seeder depot-mu!');
  }

  // 1. Ambil HANYA KURIR dari perusahaan tersebut
  const drivers = await this.prisma.user.findMany({
    where: { 
      role: 'DRIVER', 
      companyId: testCompany.id 
    },
    take: 5, // Seeder kamu bikin 10, ambil semua saja untuk test maksimal
    select: { id: true },
  });

  // 2. Ambil HANYA PAKET PENDING dari perusahaan tersebut
  const packages = await this.prisma.package.findMany({
    where: { 
      status: 'PENDING',
      companyId: testCompany.id 
    },
    take: 50,
    select: { id: true },
  });

  // 3. Validasi
  if (drivers.length === 0) throw new Error('Driver tidak ditemukan.');
  if (packages.length === 0) throw new Error('Tidak ada paket PENDING.');

  // 4. Return Output yang Rapi & Dinamis
  return {
    companyId: testCompany.id,
    driverIds: drivers.map((d) => d.id),
    packageIds: packages.map((p) => p.id),
    depotLocation: {
      lat: companyDepot.lat, 
      lng: companyDepot.lng
    }
  };
  } 

  private calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius Bumi dalam km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Hasil dalam km
    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // FUNGSI UTAMA CLUSTERING 
  async cluster(payload: ClusterRequest) { 
    const { driverIds, packageIds, depotLocation, companyId } = payload;
    const MAX_ITERATIONS = 100; // Maksimal putaran K-Means
    const MAX_RADIUS_KM = 100;

    // --- 1. DATA HYDRATION (Berdasarkan Company) ---
    const drivers = await this.prisma.user.findMany({
      where: { 
        id: { in: driverIds }, 
        companyId: companyId, 
        role: 'DRIVER'
      },
      select: { 
        id: true, 
        fullName: true, 
        vehicle: true // Ambil detail kapasitas motor
      },
    });

    const packages = await this.prisma.package.findMany({
      where: { 
        id: { in: packageIds }, 
        companyId: companyId, 
        status: 'PENDING' 
      },
      select: { id: true, lat: true, lng: true, weight: true, volume: true },
    });

    // VALIDASI DASAR 
    if (drivers.length === 0) {
      throw new BadRequestException('Kurir tidak ditemukan atau berasal dari perusahaan lain.');
    }
    if (packages.length === 0) {
      throw new BadRequestException('Tidak ada paket PENDING yang bisa diproses.');
    }
    
    const invalidPackages = packages.filter(p => !p.lat || !p.lng);
    if (invalidPackages.length > 0) {
       throw new BadRequestException(`Ada ${invalidPackages.length} paket yang belum punya koordinat GPS.`);
    }

    // SETUP CENTROIDS & K-MEANS 
    const k = drivers.length; 
    type PackageData = typeof packages[0];

    interface Centroid {
      driverId: string;
      driverName: string;
      maxWeight: number;
      maxVolume: number;
      lat: number;
      lng: number;
      currentWeight: number;
      currentVolume: number;
      assignedPackages: PackageData[];
    }

    const centroids: Centroid[] = [];
    const shuffledPackages = [...packages].sort(() => 0.5 - Math.random());
    
    // Inisialisasi Titik Awal Centroid
    for (let i = 0; i < k; i++) {
      centroids.push({
        driverId: drivers[i].id,
        driverName: drivers[i].fullName,
        maxWeight: drivers[i].vehicle?.maxWeight || 50, 
        maxVolume: drivers[i].vehicle?.maxVolume || 100,
        lat: shuffledPackages[i]?.lat || depotLocation.lat, 
        lng: shuffledPackages[i]?.lng || depotLocation.lng,
        currentWeight: 0,
        currentVolume: 0,
        assignedPackages: [], 
      });
    }

    let hasChanged = true;
    let iteration = 0;
    const unassignedPackages: PackageData[] = []; 

    // Looping K-Means
    while (hasChanged && iteration < MAX_ITERATIONS) {
      hasChanged = false;
      iteration++;
      unassignedPackages.length = 0; 

      // Reset muatan kurir di setiap awal iterasi
      centroids.forEach(c => {
        c.currentWeight = 0;
        c.currentVolume = 0;
        c.assignedPackages = [];
      });

      // Assign paket ke kurir terdekat (Dengan Constraint Kapasitas)
      for (const pkg of packages) {
        let nearestCentroid: Centroid | null = null;
        let minDistance = Infinity;

        for (const centroid of centroids) {
          const isWeightFit = centroid.currentWeight + pkg.weight <= centroid.maxWeight;
          const isVolumeFit = centroid.currentVolume + pkg.volume <= centroid.maxVolume;

          if (isWeightFit && isVolumeFit) {
            const distance = this.calculateHaversineDistance(
              pkg.lat as number, 
              pkg.lng as number, 
              centroid.lat, 
              centroid.lng
            );
            
            if (distance < minDistance && distance <= MAX_RADIUS_KM) {
              minDistance = distance;
              nearestCentroid = centroid;
            }
          }
        }

        // Masukkan paket ke kurir, atau buang ke unassigned jika semua motor penuh
        if (nearestCentroid) {
          nearestCentroid.assignedPackages.push(pkg);
          nearestCentroid.currentWeight += pkg.weight;
          nearestCentroid.currentVolume += pkg.volume;
        } else {
          unassignedPackages.push(pkg);
        }
      }

      // Hitung ulang posisi centroid
      for (const centroid of centroids) {
        if (centroid.assignedPackages.length > 0) {
          const sumLat = centroid.assignedPackages.reduce((sum, p) => sum + (p.lat as number), 0);
          const sumLng = centroid.assignedPackages.reduce((sum, p) => sum + (p.lng as number), 0);
          
          const newLat = sumLat / centroid.assignedPackages.length;
          const newLng = sumLng / centroid.assignedPackages.length;

          // Cek konvergensi
          if (Math.abs(centroid.lat - newLat) > 0.0001 || Math.abs(centroid.lng - newLng) > 0.0001) {
            hasChanged = true;
          }

          centroid.lat = newLat;
          centroid.lng = newLng;
        }
      }
    }

    return {
      message: 'Clustering K-Means Berhasil!',
      totalIterationsRun: iteration,
      depot: depotLocation,
      summary: {
        totalDrivers: k,
        totalPackagesToProcess: packages.length,
        successfullyAssigned: packages.length - unassignedPackages.length,
        unassignedPackagesCount: unassignedPackages.length,
      },
      clusters: centroids.map(c => ({
        driverId: c.driverId,
        driverName: c.driverName,
        centerLocation: { lat: c.lat, lng: c.lng },
        capacityUsage: {
          currentWeight: c.currentWeight,
          maxWeight: c.maxWeight,
          currentVolume: c.currentVolume,
          maxVolume: c.maxVolume,
        },
        packageCount: c.assignedPackages.length,
        packages: c.assignedPackages, 
      })),
      unassigned: unassignedPackages, 
    };
  }
}
