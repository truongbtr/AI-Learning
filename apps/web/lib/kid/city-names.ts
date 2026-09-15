import { CITY_SUBJECTS, type CitySubject } from "@mtct/core";

/**
 * Words and colours for the city screens (Pha 10 §2). Kept apart from @mtct/city so that client
 * components can show a name without pulling three.js into the first bundle.
 */
export const CITY_INFO: Record<
  CitySubject,
  { name: string; subject: string; a: string; b: string; wonder: string; emoji: string }
> = {
  viet: {
    name: "Phố Chữ",
    subject: "Tiếng Việt",
    a: "#E76F51",
    b: "#6FAE5A",
    wonder: "Chùa Một Cột",
    emoji: "🏮",
  },
  vmath: {
    name: "Thành Số",
    subject: "Toán",
    a: "#5E93D6",
    b: "#FFD447",
    wonder: "Kim tự tháp",
    emoji: "🔢",
  },
  esl: {
    name: "Bến Cảng Từ",
    subject: "Tiếng Anh",
    a: "#2A9D8F",
    b: "#F4A261",
    wonder: "Tượng Nữ thần Tự do",
    emoji: "⚓",
  },
  enl: {
    name: "Vườn Sách",
    subject: "English",
    a: "#8E7CC3",
    b: "#9BD07E",
    wonder: "Đền Parthenon",
    emoji: "📚",
  },
  emath: {
    name: "Xưởng Máy",
    subject: "English Maths",
    a: "#E9954A",
    b: "#8896A6",
    wonder: "Tháp Eiffel",
    emoji: "⚙️",
  },
  esci: {
    name: "Trạm Khám Phá",
    subject: "Science",
    a: "#47B8C4",
    b: "#B283E0",
    wonder: "Vạn Lý Trường Thành",
    emoji: "🔭",
  },
};

export const PLOT_BUILD_NAMES: Record<string, { nameVi: string; emoji: string }> = {
  house: { nameVi: "Nhà xinh", emoji: "🏠" },
  garden: { nameVi: "Vườn hoa", emoji: "🌷" },
  pond: { nameVi: "Ao vịt", emoji: "🦆" },
  shop: { nameVi: "Cửa hàng", emoji: "🏪" },
  miniPark: { nameVi: "Công viên nhỏ", emoji: "⛲" },
  bakery: { nameVi: "Tiệm bánh", emoji: "🧁" },
  treehouse: { nameVi: "Nhà trên cây", emoji: "🌳" },
  windmill: { nameVi: "Cối xay gió", emoji: "🌬️" },
  lighthouse: { nameVi: "Tháp canh nhỏ", emoji: "🗼" },
  tower: { nameVi: "Toà nhà cao", emoji: "🏙️" },
};

export const PUBLIC_BUILDING_NAMES: Record<string, string> = {
  school: "Trường học",
  library: "Thư viện",
  playground: "Sân chơi",
  pool: "Bể bơi",
  football: "Sân bóng",
  circus: "Rạp xiếc",
  zoo: "Vườn thú",
  station: "Ga tàu",
  ferris: "Vòng quay",
  market: "Chợ",
  fireStation: "Trạm cứu hoả",
  postOffice: "Bưu điện",
  museum: "Bảo tàng",
  theater: "Nhà hát",
  aquarium: "Thuỷ cung",
};

export function isCity(value: string | undefined): value is CitySubject {
  return (CITY_SUBJECTS as readonly string[]).includes(value ?? "");
}

/** The child's own city as last seen, shown on its island (per child: two children share a browser). */
export const snapshotKey = (studentId: string, city: CitySubject) =>
  `mtct.city.snap.${studentId}.${city}`;
