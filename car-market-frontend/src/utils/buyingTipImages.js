const buyingTipImageSources = {
  history: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85',
  testDrive: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d',
  paint: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d',
  records: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f',
  negotiate: 'https://images.unsplash.com/photo-1521791136064-7986c2920216',
  mechanic: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3',
};

export const getBuyingTipImage = (topic, width = 800, height = 500) => {
  const source = buyingTipImageSources[topic] || buyingTipImageSources.history;
  return `${source}?auto=format&fit=crop&w=${width}&h=${height}&q=80`;
};
