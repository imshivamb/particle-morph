const CAMERA_FOV_DEG = 42;
const CAMERA_Z = 3.1;

export function fieldPointFromClient(input: {
  clientX: number;
  clientY: number;
  width: number;
  height: number;
  cameraZ?: number;
}): { x: number; y: number } {
  const width = Math.max(1, input.width);
  const height = Math.max(1, input.height);
  const ndcX = (input.clientX / width) * 2 - 1;
  const ndcY = 1 - (input.clientY / height) * 2;
  const cameraZ = input.cameraZ ?? CAMERA_Z;
  const visibleHeight = 2 * Math.tan((CAMERA_FOV_DEG * Math.PI) / 360) * cameraZ;
  const visibleWidth = visibleHeight * (width / height);
  return {
    x: ndcX * visibleWidth * 0.5,
    y: ndcY * visibleHeight * 0.5,
  };
}