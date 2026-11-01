// Transform all corners through the supported point API. This also handles
// rotated/cropped pages without relying on a removed PDF.js rectangle method.
export function viewportRectangle(viewport, rect) {
  if (typeof viewport?.convertToViewportPoint !== 'function' || !Array.isArray(rect) || rect.length !== 4 || rect.some(value => !Number.isFinite(value))) throw new Error('The PDF location has unsupported page geometry.');
  const points = [[rect[0], rect[1]], [rect[0], rect[3]], [rect[2], rect[1]], [rect[2], rect[3]]].map(([x, y]) => viewport.convertToViewportPoint(x, y));
  if (points.some(point => !Array.isArray(point) || point.length !== 2 || point.some(value => !Number.isFinite(value)))) throw new Error('The PDF location could not be transformed.');
  return [Math.min(...points.map(point => point[0])), Math.min(...points.map(point => point[1])), Math.max(...points.map(point => point[0])), Math.max(...points.map(point => point[1]))];
}
