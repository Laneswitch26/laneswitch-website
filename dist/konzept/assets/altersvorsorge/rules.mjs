/** Reviewed before implementation; see docs/altersvorsorge-2027.md. Money: integer cents. */
export const RULES = Object.freeze({
  year:2027, effectiveFrom:'2027-01-01', reviewedAt:'2026-10-22',
  law:'AltVRefG vom 26.05.2026, BGBl. 2026 I Nr. 156; Art. 2, 6, 14',
  minimumCents:12000, firstTierCents:36000, eligibleCapCents:180000,
  firstRate:0.5, secondRate:0.25, childCapCents:30000, childRate:1,
  bonusCents:20000, bonusAgeExclusive:25, selfEmployedAgeExclusive:67,
  contractCapCents:684000,
  sources:Object.freeze([
    ['Bundesgesetzblatt', 'https://www.recht.bund.de/bgbl/1/2026/156/VO.html'],
    ...['0010a','0079','0082','0084','0085','0086'].map(n=>[
      'EStG § '+n.replace(/^0+/,'' )+' · Fassung 2027',
      `https://rvrecht.deutsche-rentenversicherung.de/SharedDocs/rvRecht/05_Normen_und_Vertraege/02_C-K/EStG/${n}/${n}_2027_01_01.html`
    ])
  ])
});
export const CONTACT = Object.freeze({email:'kontakt@laneswitch.de',firstInfo:'https://signal-iduna-agentur.de/steven.dragojevic/'});
