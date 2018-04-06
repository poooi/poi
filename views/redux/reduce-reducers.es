export default function reduceReducers(...reducers) {
  return (previous, ...current) =>
    reducers.reduce(
      (p, r) => r(p, ...current),
      previous
    )
}
