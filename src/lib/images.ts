const pexels = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&h=650&w=940`;

export const IMAGES = {
  hero: pexels(30903758),
  workspacePreview: pexels(39694504),
  authPanel: pexels(8102677),
  templates: {
    neonCityIntro: pexels(30903758),
    cinematicGrade: pexels(39694481),
    glowingTubeLowerThird: pexels(14053646),
    fluidVelocityReel: pexels(39195874),
  },
  community: {
    nightDriveNeon: pexels(948076),
    liquidColourStudy: pexels(39195874),
    retouchedPortrait: pexels(16313530),
    studioGrading: pexels(9850422),
  },
  creators: [pexels(13929970), pexels(4910386), pexels(13929353)],
} as const;
