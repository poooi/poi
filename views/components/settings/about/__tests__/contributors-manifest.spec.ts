import { loadContributors, normalizeCreditsManifest } from '../contributors-manifest'
import fixture from './__fixtures__/credits-manifest.sample.json'

describe('normalizeCreditsManifest', () => {
  const contributors = normalizeCreditsManifest(fixture)

  it('keeps contributor order and falls back to login when the name is missing', () => {
    expect(contributors.map((contributor) => contributor.id)).toEqual([
      'github:edwardaaaa',
      'github:hanzhao',
      'github:myzwillmake',
      'github:nobody',
      'github:legacy',
    ])
    expect(contributors.map((contributor) => contributor.label)).toEqual([
      'edwardaaaa',
      'Maggie',
      'myzWILLmake',
      'nobody',
      'legacy',
    ])
  })

  it('resolves relative sheet urls against the manifest origin', () => {
    expect(contributors[0].avatar?.url).toBe(
      'https://poi.moe/api/credits/avatars-0.018a0c0626d46f3c.webp',
    )
  })

  it('scales nonzero sprite coordinates and sheet dimensions to a 40px avatar', () => {
    expect(contributors[1].avatar).toEqual({
      url: 'https://poi.moe/api/credits/avatars-0.018a0c0626d46f3c.webp',
      sheetWidth: 640,
      sheetHeight: 440,
      offsetX: 40,
      offsetY: 40,
    })
  })

  it('uses the referenced sheet for multi-sheet avatars', () => {
    expect(contributors[2].avatar).toEqual({
      url: 'https://poi.moe/api/credits/avatars-1.deadbeef00.webp',
      sheetWidth: 400,
      sheetHeight: 200,
      offsetX: 80,
      offsetY: 0,
    })
  })

  it('keeps contributors without an avatar with a null sprite', () => {
    expect(contributors[3].avatar).toBeNull()
  })

  it('keeps http(s) profile links and drops other schemes', () => {
    expect(contributors[0].profile).toBe('https://github.com/edwardaaaa')
    expect(contributors[4].profile).toBeNull()
  })
})

describe('loadContributors', () => {
  let fetchMock: jest.SpyInstance

  beforeEach(() => {
    fetchMock = jest.spyOn(globalThis, 'fetch')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('fetches the manifest and returns normalized contributors', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify(fixture), { status: 200 }))

    const contributors = await loadContributors()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(contributors).toHaveLength(5)
    expect(contributors[0].avatar?.url).toBe(
      'https://poi.moe/api/credits/avatars-0.018a0c0626d46f3c.webp',
    )
  })

  it('aborts the forwarded request when the caller signal aborts', async () => {
    const controller = new AbortController()
    const requestSignals: (AbortSignal | undefined)[] = []
    fetchMock.mockImplementation((_url, options) => {
      requestSignals.push(options?.signal)
      return new Promise<Response>((_resolve, reject) => {
        requestSignals[0]?.addEventListener('abort', () =>
          reject(new DOMException('Aborted', 'AbortError')),
        )
      })
    })

    const promise = loadContributors(controller.signal)
    controller.abort()

    await expect(promise).rejects.toThrow()
    expect(requestSignals[0]?.aborted).toBe(true)
  })

  it('rejects when the request times out', async () => {
    const timeoutController = new AbortController()
    jest.spyOn(AbortSignal, 'timeout').mockReturnValue(timeoutController.signal)
    fetchMock.mockImplementation((_url, options) => {
      return new Promise<Response>((_resolve, reject) => {
        options?.signal?.addEventListener('abort', () =>
          reject(new DOMException('The operation was aborted due to timeout', 'TimeoutError')),
        )
      })
    })

    const promise = loadContributors()
    timeoutController.abort()

    await expect(promise).rejects.toThrow()
  })

  it('rejects when the caller signal is already aborted', async () => {
    const controller = new AbortController()
    controller.abort()
    fetchMock.mockImplementation((_url, options) =>
      options?.signal?.aborted
        ? Promise.reject(new DOMException('Aborted', 'AbortError'))
        : Promise.resolve(new Response(JSON.stringify(fixture))),
    )

    await expect(loadContributors(controller.signal)).rejects.toThrow()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('rejects when the response is not ok', async () => {
    fetchMock.mockResolvedValue(new Response('nope', { status: 503 }))

    await expect(loadContributors()).rejects.toThrow('HTTP 503')
  })

  it('rejects when the body is not valid JSON', async () => {
    fetchMock.mockResolvedValue(new Response('{ not json'))

    await expect(loadContributors()).rejects.toThrow()
  })

  it('rejects on an unsupported manifest schema', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ...fixture, schemaVersion: 2 })))

    await expect(loadContributors()).rejects.toThrow('Unsupported credits manifest schema')
  })
})
