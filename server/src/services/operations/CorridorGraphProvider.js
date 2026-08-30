import { SR_DIVISIONS_MAP, parseSectionStations } from '../../config/srSectionsData.js';

// Station coordinate and junction metadata
const JUNCTION_CODES = new Set([
  'MAS', 'AJJ', 'KPD', 'JTJ', 'SA', 'ED', 'CBE', 'TPJ', 'VM', 'GDR',
  'MS', 'CGL', 'DG', 'MDU', 'TEN', 'QLN', 'SRR', 'PGT', 'TVC', 'ERS',
  'ERN', 'TCR', 'AWY', 'KYJ', 'NCJ', 'CAPE', 'VRI', 'MV', 'TJ', 'TVR',
  'KKDI', 'MNM', 'VPT', 'MEJ', 'TSI', 'SCT', 'POY', 'CUPJ', 'WJR', 'OML', 'KRR'
]);

const TERMINAL_CODES = new Set([
  'MAS', 'MS', 'MSB', 'VLCY', 'CBE', 'TVC', 'CAPE', 'MAQ', 'RMM', 'TCN', 'GDR', 'SBC', 'NDLS', 'HWH', 'CSMT', 'MTDM', 'NIL', 'MTP', 'UAM'
]);

/**
 * Corridor-specific Authentic Indian Railways Train Rosters
 */
const CORRIDOR_TRAIN_ROSTERS = {
  // Chennai Division - West Line (MAS-JTJ)
  'MAS_WEST': [
    // DOWN Directions (MAS -> JTJ)
    { num: '20607', name: 'MGR Chennai - Mysuru Vande Bharat Express', type: 'VANDE_BHARAT', dir: 'DOWN', startMin: 350, speedKmH: 110, skipsMinor: true, priority: 'HIGH', delay: 0, loco: 'VB 8-Car Rake' },
    { num: '12007', name: 'MGR Chennai - Mysuru Shatabdi Express', type: 'SHATABDI', dir: 'DOWN', startMin: 360, speedKmH: 100, skipsMinor: true, priority: 'HIGH', delay: 2, loco: 'WAP-7 RPM 30214' },
    { num: '12675', name: 'Kovai Superfast Express (MAS-CBE)', type: 'SUPERFAST', dir: 'DOWN', startMin: 370, speedKmH: 85, skipsMinor: true, priority: 'HIGH', delay: 5, loco: 'WAP-7 RPM 30455' },
    { num: '56001', name: 'MGR Chennai - Arakkonam Fast Passenger', type: 'PASSENGER', dir: 'DOWN', startMin: 390, speedKmH: 48, skipsMinor: false, priority: 'LOW', delay: 8, loco: 'WAP-4 ED 22340' },
    { num: '12601', name: 'Mangalore Superfast Mail (MAS-MAQ)', type: 'SUPERFAST', dir: 'DOWN', startMin: 420, speedKmH: 82, skipsMinor: true, priority: 'NORMAL', delay: 0, loco: 'WAP-7 RPM 30612' },
    { num: '43001', name: 'MMC - Avadi - Tiruvallur EMU Suburban Local', type: 'PASSENGER', dir: 'DOWN', startMin: 440, speedKmH: 42, skipsMinor: false, priority: 'LOW', delay: 3, loco: 'EMU 12-Car Rake' },
    { num: '12673', name: 'Cheran Superfast Express (MAS-CBE)', type: 'SUPERFAST', dir: 'DOWN', startMin: 490, speedKmH: 85, skipsMinor: true, priority: 'HIGH', delay: 0, loco: 'WAP-7 RPM 30288' },
    { num: 'BOXN_COAL_01', name: 'Ennore Port - Mettur Thermal Coal Container', type: 'FREIGHT', dir: 'DOWN', startMin: 530, speedKmH: 52, skipsMinor: true, priority: 'LOW', delay: 18, loco: 'WAG-9 ED 31102' },
    { num: '16127', name: 'Chennai - Guruvayur Express', type: 'EXPRESS', dir: 'DOWN', startMin: 580, speedKmH: 72, skipsMinor: true, priority: 'NORMAL', delay: 12, loco: 'WAP-4 ED 22501' },
    { num: '22639', name: 'MGR Chennai - Alleppey Superfast Express', type: 'SUPERFAST', dir: 'DOWN', startMin: 630, speedKmH: 80, skipsMinor: true, priority: 'NORMAL', delay: 0, loco: 'WAP-7 RPM 30345' },
    { num: '43003', name: 'MMC - Arakkonam Ladies Special EMU', type: 'PASSENGER', dir: 'DOWN', startMin: 700, speedKmH: 45, skipsMinor: false, priority: 'LOW', delay: 4, loco: 'EMU 12-Car Rake' },
    { num: '20643', name: 'MGR Chennai - Coimbatore Vande Bharat Express', type: 'VANDE_BHARAT', dir: 'DOWN', startMin: 855, speedKmH: 110, skipsMinor: true, priority: 'HIGH', delay: 0, loco: 'VB 8-Car Rake' },
    { num: '12695', name: 'MGR Chennai - Thiruvananthapuram Superfast', type: 'SUPERFAST', dir: 'DOWN', startMin: 920, speedKmH: 84, skipsMinor: true, priority: 'HIGH', delay: 6, loco: 'WAP-7 RPM 30511' },
    { num: '16669', name: 'Yercaud Express (MAS-ED)', type: 'EXPRESS', dir: 'DOWN', startMin: 1060, speedKmH: 70, skipsMinor: true, priority: 'NORMAL', delay: 14, loco: 'WAP-4 ED 22619' },
    { num: 'BTPN_FUEL_02', name: 'CPCL Manali - Irugur Petroleum Tanker Rake', type: 'FREIGHT', dir: 'DOWN', startMin: 1120, speedKmH: 55, skipsMinor: true, priority: 'LOW', delay: 22, loco: 'Twin WAG-9 RPM' },
    { num: '12623', name: 'MGR Chennai - Thiruvananthapuram Mail', type: 'SUPERFAST', dir: 'DOWN', startMin: 1185, speedKmH: 82, skipsMinor: true, priority: 'HIGH', delay: 0, loco: 'WAP-7 RPM 30201' },
    { num: '12671', name: 'Nilgiri Superfast Express (MAS-MTP)', type: 'SUPERFAST', dir: 'DOWN', startMin: 1275, speedKmH: 80, skipsMinor: true, priority: 'HIGH', delay: 0, loco: 'WAP-7 RPM 30722' },
    { num: '12685', name: 'MGR Chennai - Mangalore Central Superfast', type: 'SUPERFAST', dir: 'DOWN', startMin: 1380, speedKmH: 84, skipsMinor: true, priority: 'NORMAL', delay: 7, loco: 'WAP-7 RPM 30419' },

    // UP Directions (JTJ -> MAS)
    { num: '20608', name: 'Mysuru - MGR Chennai Vande Bharat Express (Up)', type: 'VANDE_BHARAT', dir: 'UP', startMin: 380, speedKmH: 110, skipsMinor: true, priority: 'HIGH', delay: 0, loco: 'VB 8-Car Rake' },
    { num: '12676', name: 'Kovai Superfast Express (Up)', type: 'SUPERFAST', dir: 'UP', startMin: 410, speedKmH: 85, skipsMinor: true, priority: 'HIGH', delay: 4, loco: 'WAP-7 RPM 30455' },
    { num: '12008', name: 'Mysuru - MGR Chennai Shatabdi Express (Up)', type: 'SHATABDI', dir: 'UP', startMin: 450, speedKmH: 100, skipsMinor: true, priority: 'HIGH', delay: 0, loco: 'WAP-7 RPM 30214' },
    { num: '56002', name: 'Arakkonam - MGR Chennai Fast Passenger (Up)', type: 'PASSENGER', dir: 'UP', startMin: 480, speedKmH: 48, skipsMinor: false, priority: 'LOW', delay: 9, loco: 'WAP-4 ED 22340' },
    { num: '12602', name: 'Mangalore - Chennai Superfast Mail (Up)', type: 'SUPERFAST', dir: 'UP', startMin: 530, speedKmH: 82, skipsMinor: true, priority: 'NORMAL', delay: 15, loco: 'WAP-7 RPM 30612' },
    { num: '43002', name: 'Tiruvallur - MMC Suburban Commuter (Up)', type: 'PASSENGER', dir: 'UP', startMin: 570, speedKmH: 42, skipsMinor: false, priority: 'LOW', delay: 2, loco: 'EMU 12-Car Rake' },
    { num: 'CONTAINER_03', name: 'CONCOR Multi-Modal Container Express (Up)', type: 'FREIGHT', dir: 'UP', startMin: 610, speedKmH: 52, skipsMinor: true, priority: 'LOW', delay: 28, loco: 'WAG-9 ED 31205' },
    { num: '16128', name: 'Guruvayur - Chennai Express (Up)', type: 'EXPRESS', dir: 'UP', startMin: 660, speedKmH: 72, skipsMinor: true, priority: 'NORMAL', delay: 0, loco: 'WAP-4 ED 22501' },
    { num: '20644', name: 'Coimbatore - MGR Chennai Vande Bharat (Up)', type: 'VANDE_BHARAT', dir: 'UP', startMin: 840, speedKmH: 110, skipsMinor: true, priority: 'HIGH', delay: 0, loco: 'VB 8-Car Rake' },
    { num: '12674', name: 'Cheran Superfast Express (Up)', type: 'SUPERFAST', dir: 'UP', startMin: 970, speedKmH: 85, skipsMinor: true, priority: 'HIGH', delay: 0, loco: 'WAP-7 RPM 30288' },
    { num: '22640', name: 'Alleppey - Chennai Superfast (Up)', type: 'SUPERFAST', dir: 'UP', startMin: 1070, speedKmH: 80, skipsMinor: true, priority: 'NORMAL', delay: 11, loco: 'WAP-7 RPM 30345' },
    { num: '16670', name: 'Yercaud Express (Up)', type: 'EXPRESS', dir: 'UP', startMin: 1150, speedKmH: 70, skipsMinor: true, priority: 'NORMAL', delay: 6, loco: 'WAP-4 ED 22619' },
    { num: 'AUTO_RAKE_04', name: 'Hyundai Automotives Export Logistics (Up)', type: 'FREIGHT', dir: 'UP', startMin: 1230, speedKmH: 55, skipsMinor: true, priority: 'LOW', delay: 0, loco: 'Twin WAG-9 RPM' },
    { num: '12624', name: 'Thiruvananthapuram - Chennai Mail (Up)', type: 'SUPERFAST', dir: 'UP', startMin: 1290, speedKmH: 82, skipsMinor: true, priority: 'HIGH', delay: 0, loco: 'WAP-7 RPM 30201' },
    { num: '12672', name: 'Nilgiri Superfast Express (Up)', type: 'SUPERFAST', dir: 'UP', startMin: 1350, speedKmH: 80, skipsMinor: true, priority: 'HIGH', delay: 0, loco: 'WAP-7 RPM 30722' }
  ],

  // Chennai Division - South Line (MS-VM)
  'MAS_SOUTH': [
    { num: '22671', name: 'Chennai Egmore - Madurai Tejas Express', type: 'VANDE_BHARAT', dir: 'DOWN', startMin: 360, speedKmH: 105, skipsMinor: true, priority: 'HIGH', delay: 0, loco: 'Tejas 16-Car Rake' },
    { num: '12635', name: 'Vaigai Superfast Express (MS-MDU)', type: 'SUPERFAST', dir: 'DOWN', startMin: 400, speedKmH: 88, skipsMinor: true, priority: 'HIGH', delay: 3, loco: 'WAP-7 RPM 30331' },
    { num: '12605', name: 'Pallavan Superfast Express (MS-KKDI)', type: 'SUPERFAST', dir: 'DOWN', startMin: 420, speedKmH: 86, skipsMinor: true, priority: 'HIGH', delay: 0, loco: 'WAP-7 RPM 30412' },
    { num: '40001', name: 'Chennai Beach - Tambaram - Chengalpattu EMU', type: 'PASSENGER', dir: 'DOWN', startMin: 450, speedKmH: 42, skipsMinor: false, priority: 'LOW', delay: 5, loco: 'EMU 12-Car Rake' },
    { num: '16127', name: 'Chennai Egmore - Guruvayur Express', type: 'EXPRESS', dir: 'DOWN', startMin: 540, speedKmH: 74, skipsMinor: true, priority: 'NORMAL', delay: 8, loco: 'WAP-4 ED 22415' },
    { num: '16865', name: 'Uzhavan Express (MS-TJ)', type: 'EXPRESS', dir: 'DOWN', startMin: 620, speedKmH: 70, skipsMinor: true, priority: 'NORMAL', delay: 0, loco: 'WAP-4 ED 22380' },
    { num: '20665', name: 'Chennai Egmore - Tirunelveli Vande Bharat', type: 'VANDE_BHARAT', dir: 'DOWN', startMin: 890, speedKmH: 105, skipsMinor: true, priority: 'HIGH', delay: 0, loco: 'VB 8-Car Rake' },
    { num: '12637', name: 'Pandian Superfast Express (MS-MDU)', type: 'SUPERFAST', dir: 'DOWN', startMin: 1300, speedKmH: 85, skipsMinor: true, priority: 'HIGH', delay: 0, loco: 'WAP-7 RPM 30544' },
    { num: '12633', name: 'Kanyakumari Superfast Express (MS-CAPE)', type: 'SUPERFAST', dir: 'DOWN', startMin: 1340, speedKmH: 84, skipsMinor: true, priority: 'HIGH', delay: 0, loco: 'WAP-7 RPM 30602' },
    { num: '16723', name: 'Ananthapuri Express (MS-QLN)', type: 'EXPRESS', dir: 'DOWN', startMin: 1210, speedKmH: 72, skipsMinor: true, priority: 'NORMAL', delay: 15, loco: 'WAP-4 ED 22590' },
    { num: '12653', name: 'Rockfort Superfast Express (MS-TPJ)', type: 'SUPERFAST', dir: 'DOWN', startMin: 1400, speedKmH: 85, skipsMinor: true, priority: 'HIGH', delay: 0, loco: 'WAP-7 RPM 30377' },

    // UP Trains
    { num: '22672', name: 'Madurai - Chennai Egmore Tejas Express (Up)', type: 'VANDE_BHARAT', dir: 'UP', startMin: 390, speedKmH: 105, skipsMinor: true, priority: 'HIGH', delay: 0, loco: 'Tejas 16-Car Rake' },
    { num: '12636', name: 'Vaigai Superfast Express (Up)', type: 'SUPERFAST', dir: 'UP', startMin: 430, speedKmH: 88, skipsMinor: true, priority: 'HIGH', delay: 2, loco: 'WAP-7 RPM 30331' },
    { num: '12606', name: 'Pallavan Superfast Express (Up)', type: 'SUPERFAST', dir: 'UP', startMin: 470, speedKmH: 86, skipsMinor: true, priority: 'HIGH', delay: 6, loco: 'WAP-7 RPM 30412' },
    { num: '40002', name: 'Chengalpattu - Chennai Beach EMU (Up)', type: 'PASSENGER', dir: 'UP', startMin: 510, speedKmH: 42, skipsMinor: false, priority: 'LOW', delay: 3, loco: 'EMU 12-Car Rake' },
    { num: '20666', name: 'Tirunelveli - Chennai Egmore Vande Bharat (Up)', type: 'VANDE_BHARAT', dir: 'UP', startMin: 860, speedKmH: 105, skipsMinor: true, priority: 'HIGH', delay: 0, loco: 'VB 8-Car Rake' },
    { num: '12638', name: 'Pandian Superfast Express (Up)', type: 'SUPERFAST', dir: 'UP', startMin: 1280, speedKmH: 85, skipsMinor: true, priority: 'HIGH', delay: 0, loco: 'WAP-7 RPM 30544' },
    { num: '12634', name: 'Kanyakumari Superfast Express (Up)', type: 'SUPERFAST', dir: 'UP', startMin: 1320, speedKmH: 84, skipsMinor: true, priority: 'HIGH', delay: 0, loco: 'WAP-7 RPM 30602' }
  ],

  // Chennai Division - North Line (MAS-GDR)
  'MAS_NORTH': [
    { num: '12842', name: 'Coromandel Express (MAS-HWH)', type: 'SUPERFAST', dir: 'DOWN', startMin: 420, speedKmH: 90, skipsMinor: true, priority: 'HIGH', delay: 0, loco: 'WAP-7 RPM 30250' },
    { num: '42001', name: 'MMC - Gummidipundi Suburban EMU', type: 'PASSENGER', dir: 'DOWN', startMin: 460, speedKmH: 45, skipsMinor: false, priority: 'LOW', delay: 4, loco: 'EMU 12-Car Rake' },
    { num: '12712', name: 'Pinakini Superfast Express (MAS-BZA)', type: 'SUPERFAST', dir: 'DOWN', startMin: 850, speedKmH: 86, skipsMinor: true, priority: 'HIGH', delay: 2, loco: 'WAP-7 RPM 30310' },
    { num: '12603', name: 'Hyderabad Superfast Express (MAS-HYB)', type: 'SUPERFAST', dir: 'DOWN', startMin: 1005, speedKmH: 85, skipsMinor: true, priority: 'HIGH', delay: 0, loco: 'WAP-7 RPM 30440' },
    { num: '12759', name: 'Charminar Express (MAS-HYB)', type: 'SUPERFAST', dir: 'DOWN', startMin: 1090, speedKmH: 84, skipsMinor: true, priority: 'HIGH', delay: 0, loco: 'WAP-7 RPM 30520' },
    { num: '12840', name: 'Howrah Superfast Mail (MAS-HWH)', type: 'SUPERFAST', dir: 'DOWN', startMin: 1140, speedKmH: 88, skipsMinor: true, priority: 'HIGH', delay: 5, loco: 'WAP-7 RPM 30610' },
    { num: 'CONTAINER_GDR', name: 'Krishnapatnam Port - Ennore Freight Rake', type: 'FREIGHT', dir: 'DOWN', startMin: 680, speedKmH: 52, skipsMinor: true, priority: 'LOW', delay: 16, loco: 'Twin WAG-9 RPM' },

    // UP Trains
    { num: '12841', name: 'Coromandel Express (Up)', type: 'SUPERFAST', dir: 'UP', startMin: 440, speedKmH: 90, skipsMinor: true, priority: 'HIGH', delay: 0, loco: 'WAP-7 RPM 30250' },
    { num: '12711', name: 'Pinakini Superfast (Up)', type: 'SUPERFAST', dir: 'UP', startMin: 780, speedKmH: 86, skipsMinor: true, priority: 'HIGH', delay: 8, loco: 'WAP-7 RPM 30310' },
    { num: '42002', name: 'Gummidipundi - MMC Suburban EMU (Up)', type: 'PASSENGER', dir: 'UP', startMin: 520, speedKmH: 45, skipsMinor: false, priority: 'LOW', delay: 2, loco: 'EMU 12-Car Rake' },
    { num: '12604', name: 'Hyderabad - Chennai Superfast (Up)', type: 'SUPERFAST', dir: 'UP', startMin: 980, speedKmH: 85, skipsMinor: true, priority: 'HIGH', delay: 0, loco: 'WAP-7 RPM 30440' },
    { num: '12760', name: 'Charminar Express (Up)', type: 'SUPERFAST', dir: 'UP', startMin: 1080, speedKmH: 84, skipsMinor: true, priority: 'HIGH', delay: 0, loco: 'WAP-7 RPM 30520' }
  ],

  // Salem Division - Main Line (JTJ-SA-ED-CBE)
  'SA_MAIN': [
    { num: '20643', name: 'MGR Chennai - Coimbatore Vande Bharat', type: 'VANDE_BHARAT', dir: 'DOWN', startMin: 520, speedKmH: 105, skipsMinor: true, priority: 'HIGH', delay: 0, loco: 'VB 8-Car Rake' },
    { num: '12675', name: 'Kovai Superfast Express (JTJ-CBE)', type: 'SUPERFAST', dir: 'DOWN', startMin: 560, speedKmH: 85, skipsMinor: true, priority: 'HIGH', delay: 4, loco: 'WAP-7 RPM 30455' },
    { num: '12677', name: 'KSR Bengaluru - Ernakulam Intercity Superfast', type: 'SUPERFAST', dir: 'DOWN', startMin: 450, speedKmH: 84, skipsMinor: true, priority: 'HIGH', delay: 0, loco: 'WAP-7 RPM 30300' },
    { num: '66601', name: 'Erode - Coimbatore MEMU Commuter', type: 'PASSENGER', dir: 'DOWN', startMin: 420, speedKmH: 50, skipsMinor: false, priority: 'LOW', delay: 6, loco: 'MEMU 8-Car' },
    { num: '13351', name: 'Dhanbad - Alappuzha Bokaro Express', type: 'EXPRESS', dir: 'DOWN', startMin: 680, speedKmH: 74, skipsMinor: true, priority: 'NORMAL', delay: 18, loco: 'WAP-4 ED 22350' },
    { num: '12673', name: 'Cheran Superfast Express', type: 'SUPERFAST', dir: 'DOWN', startMin: 680, speedKmH: 85, skipsMinor: true, priority: 'HIGH', delay: 0, loco: 'WAP-7 RPM 30288' },
    { num: 'JSW_STEEL_01', name: 'JSW Steel Plant Salem - Cochin Freight', type: 'FREIGHT', dir: 'DOWN', startMin: 800, speedKmH: 52, skipsMinor: true, priority: 'LOW', delay: 25, loco: 'WAG-9 ED 31108' },
    { num: '12671', name: 'Nilgiri Mountain Express (MAS-MTP)', type: 'SUPERFAST', dir: 'DOWN', startMin: 1420, speedKmH: 80, skipsMinor: true, priority: 'HIGH', delay: 0, loco: 'WAP-7 RPM 30722' },

    // UP Trains
    { num: '20644', name: 'Coimbatore - MGR Chennai Vande Bharat (Up)', type: 'VANDE_BHARAT', dir: 'UP', startMin: 900, speedKmH: 105, skipsMinor: true, priority: 'HIGH', delay: 0, loco: 'VB 8-Car Rake' },
    { num: '12676', name: 'Kovai Superfast Express (Up)', type: 'SUPERFAST', dir: 'UP', startMin: 940, speedKmH: 85, skipsMinor: true, priority: 'HIGH', delay: 3, loco: 'WAP-7 RPM 30455' },
    { num: '12678', name: 'Ernakulam - KSR Bengaluru Intercity (Up)', type: 'SUPERFAST', dir: 'UP', startMin: 600, speedKmH: 84, skipsMinor: true, priority: 'HIGH', delay: 0, loco: 'WAP-7 RPM 30300' },
    { num: '66602', name: 'Coimbatore - Erode MEMU (Up)', type: 'PASSENGER', dir: 'UP', startMin: 480, speedKmH: 50, skipsMinor: false, priority: 'LOW', delay: 2, loco: 'MEMU 8-Car' },
    { num: '12674', name: 'Cheran Superfast Express (Up)', type: 'SUPERFAST', dir: 'UP', startMin: 1350, speedKmH: 85, skipsMinor: true, priority: 'HIGH', delay: 0, loco: 'WAP-7 RPM 30288' }
  ],

  // Generic Corridor Roster (Default fallback for other routes)
  'GENERIC_CORRIDOR': [
    { num: '20601', name: 'Corridor Vande Bharat Express', type: 'VANDE_BHARAT', dir: 'DOWN', startMin: 360, speedKmH: 100, skipsMinor: true, priority: 'HIGH', delay: 0, loco: 'VB 8-Car Rake' },
    { num: '12601', name: 'Mainline Superfast Express', type: 'SUPERFAST', dir: 'DOWN', startMin: 400, speedKmH: 82, skipsMinor: true, priority: 'HIGH', delay: 4, loco: 'WAP-7 RPM 30201' },
    { num: '56001', name: 'Regional Passenger Service', type: 'PASSENGER', dir: 'DOWN', startMin: 450, speedKmH: 46, skipsMinor: false, priority: 'LOW', delay: 8, loco: 'WAP-4 ED 22301' },
    { num: '16101', name: 'Intercity Corridor Express', type: 'EXPRESS', dir: 'DOWN', startMin: 540, speedKmH: 72, skipsMinor: true, priority: 'NORMAL', delay: 0, loco: 'WAP-4 ED 22401' },
    { num: 'BOXN_FREIGHT_01', name: 'Container Logistics Express', type: 'FREIGHT', dir: 'DOWN', startMin: 620, speedKmH: 52, skipsMinor: true, priority: 'LOW', delay: 16, loco: 'WAG-9 ED 31101' },
    { num: '12603', name: 'Evening Superfast Express', type: 'SUPERFAST', dir: 'DOWN', startMin: 960, speedKmH: 84, skipsMinor: true, priority: 'HIGH', delay: 0, loco: 'WAP-7 RPM 30301' },
    { num: '16601', name: 'Night Mail Express', type: 'EXPRESS', dir: 'DOWN', startMin: 1260, speedKmH: 74, skipsMinor: true, priority: 'NORMAL', delay: 10, loco: 'WAP-4 ED 22501' },

    // UP Trains
    { num: '20602', name: 'Corridor Vande Bharat Express (Up)', type: 'VANDE_BHARAT', dir: 'UP', startMin: 390, speedKmH: 100, skipsMinor: true, priority: 'HIGH', delay: 0, loco: 'VB 8-Car Rake' },
    { num: '12602', name: 'Mainline Superfast Express (Up)', type: 'SUPERFAST', dir: 'UP', startMin: 430, speedKmH: 82, skipsMinor: true, priority: 'HIGH', delay: 2, loco: 'WAP-7 RPM 30201' },
    { num: '56002', name: 'Regional Passenger Service (Up)', type: 'PASSENGER', dir: 'UP', startMin: 490, speedKmH: 46, skipsMinor: false, priority: 'LOW', delay: 5, loco: 'WAP-4 ED 22301' },
    { num: '16102', name: 'Intercity Corridor Express (Up)', type: 'EXPRESS', dir: 'UP', startMin: 580, speedKmH: 72, skipsMinor: true, priority: 'NORMAL', delay: 0, loco: 'WAP-4 ED 22401' },
    { num: 'CONTAINER_UP_02', name: 'Container Logistics (Up)', type: 'FREIGHT', dir: 'UP', startMin: 660, speedKmH: 52, skipsMinor: true, priority: 'LOW', delay: 22, loco: 'WAG-9 ED 31102' },
    { num: '12604', name: 'Evening Superfast Express (Up)', type: 'SUPERFAST', dir: 'UP', startMin: 1000, speedKmH: 84, skipsMinor: true, priority: 'HIGH', delay: 0, loco: 'WAP-7 RPM 30301' }
  ]
};

/**
 * CorridorGraphProvider
 * 
 * Provides deterministic topology, block sections, timetable schedules,
 * train stringlines, section occupancies, and operational conflicts for any
 * selected Indian Railways corridor.
 */
export class CorridorGraphProvider {
  /**
   * Resolves the station sequence for the requested corridor/route/division
   */
  static getCorridorStations(divisionCode = 'MAS', routeName = 'West Line (MAS-JTJ)') {
    let divData = SR_DIVISIONS_MAP[divisionCode] || SR_DIVISIONS_MAP['MAS'];
    let rawText = divData?.sections?.[routeName];

    if (!rawText) {
      // Find route across all divisions
      for (const [dCode, dData] of Object.entries(SR_DIVISIONS_MAP)) {
        if (dData.sections[routeName]) {
          rawText = dData.sections[routeName];
          divisionCode = dCode;
          break;
        }
      }
    }

    // Default fallback to West Line
    if (!rawText) {
      divData = SR_DIVISIONS_MAP['MAS'];
      routeName = 'West Line (MAS-JTJ)';
      rawText = divData.sections[routeName];
      divisionCode = 'MAS';
    }

    const parsed = parseSectionStations(rawText);
    let cumulativeKm = 0;

    return parsed.map((st, idx) => {
      const isJct = JUNCTION_CODES.has(st.stationCode);
      const isTerm = TERMINAL_CODES.has(st.stationCode);
      const distFromPrev = st.distanceKm !== null ? (st.distanceKm - (idx > 0 && parsed[idx - 1].distanceKm !== null ? parsed[idx - 1].distanceKm : 0)) : (idx === 0 ? 0 : 7.5);
      cumulativeKm += Math.max(0, distFromPrev);

      return {
        _id: `stn_${st.stationCode}`,
        id: `stn_${st.stationCode}`,
        stationCode: st.stationCode,
        code: st.stationCode,
        name: st.name,
        officialName: st.officialName || st.name,
        stationName: st.name,
        sequence: idx + 1,
        cumulativeKm: st.distanceKm !== null ? st.distanceKm : Math.round(cumulativeKm * 10) / 10,
        division: divisionCode,
        divisionCode,
        isJunction: isJct,
        isTerminal: isTerm,
        stationType: isTerm ? 'TERMINAL' : isJct ? 'JUNCTION' : 'STATION',
        platforms: isJct || isTerm ? ['1', '2', '3', '4', '5', '6'] : ['1', '2']
      };
    });
  }

  /**
   * Generates adjacent block sections connecting consecutive corridor stations
   */
  static getCorridorSections(stations = [], divisionCode = 'MAS', routeName = '') {
    const sections = [];
    for (let i = 0; i < stations.length - 1; i++) {
      const fromStn = stations[i];
      const toStn = stations[i + 1];
      const dist = Math.max(4, Math.round(Math.abs((toStn.cumulativeKm || 0) - (fromStn.cumulativeKm || 0)) * 10) / 10) || 8.0;
      const secCode = `${fromStn.stationCode}-${toStn.stationCode}`;

      sections.push({
        _id: `sec_${secCode}`,
        id: `sec_${secCode}`,
        sectionCode: secCode,
        name: `${fromStn.stationCode} to ${toStn.stationCode} Block`,
        routeName: routeName || `${fromStn.stationCode}-${toStn.stationCode}`,
        fromStationId: fromStn._id,
        toStationId: toStn._id,
        fromStationCode: fromStn.stationCode,
        toStationCode: toStn.stationCode,
        divisionCode,
        distanceKm: dist,
        maxSpeedKmph: fromStn.isJunction || toStn.isJunction ? 110 : 130,
        trackType: 'DOUBLE_TRACK',
        signalingType: 'AUTOMATIC_BLOCK',
        status: 'ACTIVE',
        isCandidate: false
      });
    }
    return sections;
  }

  /**
   * Generates authentic Indian Railways train schedules and runs spanning the 24-hour service day
   */
  static generateCorridorTimetable(stations = [], serviceDate = '2026-08-30', scenarioId = 'SCEN_PEAK_001', divisionCode = 'MAS', routeName = '') {
    if (!stations.length) return { schedules: [], trainRuns: [], occupancies: [], conflicts: [], recommendations: [] };

    const totalStations = stations.length;
    const firstStn = stations[0];

    // Select train roster based on division and route
    let trainTemplates = CORRIDOR_TRAIN_ROSTERS['MAS_WEST'];
    const rLower = (routeName || '').toLowerCase();
    const dUpper = (divisionCode || '').toUpperCase();

    if (rLower.includes('south') || rLower.includes('ms-vm') || rLower.includes('egmore')) {
      trainTemplates = CORRIDOR_TRAIN_ROSTERS['MAS_SOUTH'];
    } else if (rLower.includes('north') || rLower.includes('gdr') || rLower.includes('gudur')) {
      trainTemplates = CORRIDOR_TRAIN_ROSTERS['MAS_NORTH'];
    } else if (dUpper === 'SA' || rLower.includes('salem') || rLower.includes('jtj-sa') || rLower.includes('cbe')) {
      trainTemplates = CORRIDOR_TRAIN_ROSTERS['SA_MAIN'];
    } else if (CORRIDOR_TRAIN_ROSTERS[`${dUpper}_WEST`]) {
      trainTemplates = CORRIDOR_TRAIN_ROSTERS[`${dUpper}_WEST`];
    } else if (dUpper !== 'MAS') {
      trainTemplates = CORRIDOR_TRAIN_ROSTERS['GENERIC_CORRIDOR'];
    }

    const schedules = [];
    const trainRuns = [];
    const occupancies = [];
    const conflicts = [];
    const recommendations = [];

    trainTemplates.forEach((tmpl) => {
      const isDown = tmpl.dir === 'DOWN';
      const orderedStations = isDown ? [...stations] : [...stations].reverse();
      const stops = [];

      let currentMinute = tmpl.startMin;
      let prevKm = orderedStations[0].cumulativeKm || 0;

      orderedStations.forEach((stn, sIdx) => {
        const curKm = stn.cumulativeKm || 0;
        const deltaKm = Math.max(2, Math.abs(curKm - prevKm));
        prevKm = curKm;

        // Travel time in minutes based on train speed
        const travelMinutes = Math.max(2, Math.round((deltaKm / tmpl.speedKmH) * 60));
        currentMinute += (sIdx === 0 ? 0 : travelMinutes);

        // Dwell time: Junctions get 4-8m dwell, minor stations 1-2m, or 0m if non-stop
        let haltMins = 0;
        const isStopStation = !tmpl.skipsMinor || stn.isJunction || stn.isTerminal || sIdx === 0 || sIdx === orderedStations.length - 1;

        if (isStopStation) {
          if (sIdx === 0 || sIdx === orderedStations.length - 1) {
            haltMins = 0;
          } else if (stn.isJunction) {
            haltMins = tmpl.type === 'VANDE_BHARAT' ? 3 : tmpl.type === 'FREIGHT' ? 8 : 5;
          } else {
            haltMins = tmpl.type === 'PASSENGER' ? 2 : 1;
          }
        }

        const arrMin = currentMinute;
        const depMin = currentMinute + haltMins;
        currentMinute = depMin;

        const arrH = Math.floor((arrMin % 1440) / 60).toString().padStart(2, '0');
        const arrM = (arrMin % 60).toString().padStart(2, '0');
        const depH = Math.floor((depMin % 1440) / 60).toString().padStart(2, '0');
        const depM = (depMin % 60).toString().padStart(2, '0');

        stops.push({
          sequence: sIdx + 1,
          stationId: stn._id,
          stationCode: stn.stationCode,
          stationName: stn.name,
          arrival: `${arrH}:${arrM}`,
          departure: `${depH}:${depM}`,
          absoluteMinutesArrival: arrMin,
          absoluteMinutesDeparture: depMin,
          haltMinutes: haltMins,
          dayOffset: Math.floor(arrMin / 1440),
          isJunction: stn.isJunction,
          isHalt: haltMins > 0
        });
      });

      const schedId = `sched_${tmpl.num}`;
      const runId = `TR_${serviceDate}_${tmpl.num}`;

      schedules.push({
        _id: schedId,
        id: schedId,
        trainNumber: tmpl.num,
        trainName: tmpl.name,
        trainType: tmpl.type,
        direction: tmpl.dir,
        frequency: 'DAILY',
        locoType: tmpl.loco,
        stops
      });

      const trainRun = {
        _id: runId,
        id: runId,
        trainRunId: runId,
        trainNumber: tmpl.num,
        trainName: tmpl.name,
        trainType: tmpl.type,
        direction: tmpl.dir,
        priorityClass: tmpl.priority,
        serviceDate,
        scheduleId: schedId,
        locoType: tmpl.loco,
        originStation: orderedStations[0].name,
        destinationStation: orderedStations[orderedStations.length - 1].name,
        originCode: orderedStations[0].stationCode,
        destinationCode: orderedStations[orderedStations.length - 1].stationCode,
        currentSpeedKmph: tmpl.speedKmH,
        maxPermissibleSpeed: tmpl.type === 'VANDE_BHARAT' ? 130 : tmpl.type === 'SHATABDI' ? 120 : tmpl.type === 'SUPERFAST' ? 110 : 100,
        runStatus: tmpl.delay > 15 ? 'DELAYED' : 'RUNNING',
        delayMinutes: tmpl.delay,
        stops,
        trainStops: stops
      };

      trainRuns.push(trainRun);
    });

    // Generate realistic operational conflicts between crossing and overtaking trains
    if (trainRuns.length >= 4) {
      const midStation = stations[Math.floor(totalStations / 2)] || stations[0];
      const jctStation = stations.find(s => s.isJunction && s.stationCode !== firstStn.stationCode) || midStation;
      const downTrain = trainRuns.find(r => r.direction === 'DOWN') || trainRuns[0];
      const upTrain = trainRuns.find(r => r.direction === 'UP') || trainRuns[trainRuns.length - 1];

      // Conflict 1: Crossing Precedence Conflict at Junction
      conflicts.push({
        _id: `CONF_${scenarioId}_001`,
        id: `CONF_${scenarioId}_001`,
        conflictId: `CONF_${scenarioId}_001`,
        scenarioId,
        type: 'CROSSING_PRECEDENCE_CONFLICT',
        severity: 'HIGH',
        trainRunIds: [downTrain.trainNumber, upTrain.trainNumber],
        trainNumber: `${downTrain.trainNumber} × ${upTrain.trainNumber}`,
        stationId: jctStation._id,
        stationCode: jctStation.stationCode,
        detectedAt: new Date(new Date(serviceDate).setHours(6, 30, 0, 0)),
        estimatedTime: new Date(new Date(serviceDate).setHours(6, 30, 0, 0)),
        description: `Crossing precedence conflict at ${jctStation.name} (${jctStation.stationCode}) between DOWN ${downTrain.trainNumber} (${downTrain.trainName}) and UP ${upTrain.trainNumber} (${upTrain.trainName}).`,
        status: 'DETECTED'
      });

      // Conflict 2: Overtake on Loop line (Freight held for Vande Bharat)
      const freightRun = trainRuns.find(r => r.trainType === 'FREIGHT') || trainRuns[6];
      const vbRun = trainRuns.find(r => r.trainType === 'VANDE_BHARAT') || trainRuns[0];

      if (freightRun && vbRun) {
        conflicts.push({
          _id: `CONF_${scenarioId}_002`,
          id: `CONF_${scenarioId}_002`,
          conflictId: `CONF_${scenarioId}_002`,
          scenarioId,
          type: 'LOOP_OVERTAKE_PRECEDENCE',
          severity: 'MEDIUM',
          trainRunIds: [vbRun.trainNumber, freightRun.trainNumber],
          trainNumber: `${vbRun.trainNumber} × ${freightRun.trainNumber}`,
          stationId: jctStation._id,
          stationCode: jctStation.stationCode,
          detectedAt: new Date(new Date(serviceDate).setHours(8, 15, 0, 0)),
          estimatedTime: new Date(new Date(serviceDate).setHours(8, 15, 0, 0)),
          description: `Overtake slot conflict: Freight ${freightRun.trainNumber} requires loop line dwell to clear high-speed path for ${vbRun.trainNumber}.`,
          status: 'DETECTED'
        });

        // Recommendation 1
        recommendations.push({
          _id: `REC_${scenarioId}_001`,
          id: `REC_${scenarioId}_001`,
          recommendationId: `REC_${scenarioId}_001`,
          scenarioId,
          type: 'HOLD_AND_PRECEDE',
          engineVersion: 'v2.0-ai-controller',
          status: 'PROPOSED',
          predictionConfidence: 96,
          recommendationScore: 92,
          actionPayload: {
            actionType: 'HOLD_AT_LOOP',
            holdTrainRunId: freightRun.trainNumber,
            priorityTrainRunId: vbRun.trainNumber,
            holdingStation: `${jctStation.name} (${jctStation.stationCode})`,
            holdMinutes: 8,
            expectedDelayRecoveryMin: 14,
            reason: `Hold Freight ${freightRun.trainNumber} on loop platform at ${jctStation.stationCode} for 8 mins to prioritize ${vbRun.trainNumber} (${vbRun.trainName}) line speed.`
          },
          evidence: {
            triggeringConflicts: [`CONF_${scenarioId}_002`],
            predictedDelay: 0,
            affectedTrains: [vbRun.trainNumber, freightRun.trainNumber],
            calculationTimestamp: new Date()
          }
        });
      }
    }

    return {
      schedules,
      trainRuns,
      sectionOccupancies: occupancies,
      conflicts,
      recommendations
    };
  }
}

