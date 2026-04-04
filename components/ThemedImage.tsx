interface ThemedImageProps {
  lightImageUrl: string
  darkImageUrl: string
  altText: string
  caption?: string
}

export default function ThemedImage({ lightImageUrl, darkImageUrl, altText, caption }: ThemedImageProps) {
  return (
    <figure className="art-img">
      <div className="art-img-inner">
        <img
          src={lightImageUrl}
          alt={altText}
          className="themed-img themed-img-light"
        />
        <img
          src={darkImageUrl}
          alt=""
          className="themed-img themed-img-dark"
        />
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  )
}
