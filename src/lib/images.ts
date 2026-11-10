export function pexels(id: number, width = 1400) {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}`;
}

export function unsplash(id: string, width = 1400) {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=80`;
}

export const portraits = {
  nova: unsplash("1531746020798-e6953c6e8e04", 1200),
  julian: unsplash("1506794778202-cad84cf45f1d", 1200),
  amara: unsplash("1534528741775-53994a69daeb", 1200),
  sage: unsplash("1517841905240-472988babdf9", 1200),
  leo: unsplash("1507003211169-0a1dd7228f2d", 1200),
  priya: unsplash("1544005313-94ddf0286df2", 1200),
  cass: unsplash("1524504388940-b1c1722653e1", 1200),
  river: unsplash("1500648767791-00dcc994a43e", 1200),
  mina: unsplash("1494790108377-be9c29b29330", 1200),
  drew: unsplash("1472099645785-5658abf4ff4e", 1200),
  ellis: unsplash("1521119989659-a83eee488004", 1200),
  maya: pexels(1130626, 900),
  jordan: pexels(1681010, 900),
  samira: pexels(1181519, 900),
  owen: pexels(1222271, 900),
  lila: pexels(774909, 900),
  chris: pexels(91227, 900),
  avery: unsplash("1573496359142-b8d87734a5a2", 900),
};

export const works = [
  unsplash("1568515045052-f9a854d70bfd", 1600),
  unsplash("1611501275019-9b5cda994e8d", 1600),
  unsplash("1542727365-19732a80dcfd", 1600),
  unsplash("1552627019-947c3789ffb5", 1600),
  unsplash("1450297166380-cabe503887e5", 1600),
  unsplash("1562962230-16e4623d36e6", 1600),
  pexels(2183132, 1600),
  pexels(2183131, 1600),
  pexels(1304469, 1600),
  pexels(3214692, 1600),
  pexels(3356489, 1600),
  pexels(1612200, 1600),
  pexels(4125659, 1600),
  pexels(1921168, 1600),
  pexels(2472874, 1600),
  pexels(1758144, 1600),
  pexels(1415131, 1600),
  pexels(955938, 1600),
  pexels(2183136, 1600),
  pexels(3214691, 1600),
];

export function workAt(index: number, width = 1400) {
  const source = works[index % works.length];
  if (source.includes("unsplash.com")) {
    return source.replace(/w=\d+/, `w=${width}`);
  }
  return source.replace(/w=\d+/, `w=${width}`);
}
