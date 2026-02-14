"use client"

import { useEffect, useState } from "react"
import type { ClipboardEvent } from "react"
import { toast } from "sonner"
import type { SocialLinks } from "@/types/social-links"
import { extractSocialHandle, normalizeSocialLinks } from "@/lib/socialLinks"

interface SocialLinksManagerProps {
  onClose?: () => void;
  onSave?: (links: SocialLinks) => void;
  initialLinks?: SocialLinks;
}

const defaultSocialLinks: SocialLinks = {
  email: "",
  googleScholar: "",
  researchGate: "",
  orcid: "",
  github: "",
  linkedin: "",
  twitter: "",
  youtube: "",
}

export default function SocialLinksManager({ onClose, onSave, initialLinks = defaultSocialLinks }: SocialLinksManagerProps) {
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(() => normalizeSocialLinks(initialLinks))
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setSocialLinks(normalizeSocialLinks(initialLinks))
  }, [initialLinks])

  const handleChange = (platform: keyof SocialLinks, value: string) => {
    const sanitized = extractSocialHandle(platform, value)
    setSocialLinks((prev) => ({ ...prev, [platform]: sanitized }))
  }

  const handlePaste = (platform: keyof SocialLinks) => (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const pastedText = event.clipboardData.getData("text")
    const sanitized = extractSocialHandle(platform, pastedText)
    setSocialLinks((prev) => ({ ...prev, [platform]: sanitized }))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      if (onSave) {
        await Promise.resolve(onSave(normalizeSocialLinks(socialLinks)))
      }
      toast.success("Social links saved successfully!")
    } catch (error) {
      console.error("Failed to save social links:", error)
      toast.error("Failed to save social links. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex items-center justify-center p-4">
      <div className="w-full rounded-[8px] p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Manage your social links</h1>
            <p className="text-[#09090b]">You only need to type your user names below.</p>
          </div>
          <div className="flex gap-3">
            <button
              className="border border-[#e4e4e7] text-[#0f172a] px-6 py-3 rounded-[8px] font-medium"
              onClick={onClose}
              disabled={isSaving}
            >
              Close
            </button>
            <button
              className="bg-[#0f172a] text-white px-6 py-3 rounded-[8px] font-medium disabled:opacity-70 disabled:cursor-not-allowed"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Gmail */}
          <div className="flex items-center border border-[#e4e4e7] rounded-[8px] px-4 py-3">
            <div className="w-6 h-6 mr-2">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6"
              >
                <path
                  d="M1.63636 21.0043H5.45455V11.7315L0 7.64062V19.3679C0 20.272 0.732273 21.0043 1.63636 21.0043Z"
                  fill="#4285F4"
                />
                <path
                  d="M18.5449 21.0043H22.3631C23.2672 21.0043 23.9995 20.272 23.9995 19.3679V7.64062L18.5449 11.7315V21.0043Z"
                  fill="#34A853"
                />
                <path
                  d="M18.5449 4.64077V11.7317L23.9995 7.64077V5.45896C23.9995 3.43668 21.6908 2.28168 20.0722 3.49532L18.5449 4.64077Z"
                  fill="#FBBC04"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M5.45508 11.7315V4.64062L12.0005 9.54972L18.546 4.64062V11.7315L12.0005 16.6406L5.45508 11.7315Z"
                  fill="#EA4335"
                />
                <path
                  d="M0 5.45896V7.64077L5.45455 11.7317V4.64077L3.92727 3.49532C2.30864 2.28168 0 3.43668 0 5.45896Z"
                  fill="#C5221F"
                />
              </svg>
            </div>
            <span className="text-[#a1a1aa] text-sm font-normal">Email</span>
            <input
              type="email"
              onChange={(e) => handleChange("email", e.target.value)}
              onPaste={handlePaste("email")}
              value={socialLinks.email}
              className="text-[#09090B] text-sm font-medium bg-transparent outline-none ml-1 flex-1 placeholder-[#71717A]"
              placeholder="Enter your email"
            />
          </div>

          {/* Google Scholar */}
          <div className="flex items-center border border-[#e4e4e7] rounded-[8px] px-4 py-3">
            <div className="w-6 h-6 mr-2 flex items-center justify-center bg-[#4285f4] rounded-full">
              <span className="text-white font-semibold text-sm">G</span>
            </div>
            <span className="text-[#a1a1aa] text-sm font-normal">Google Scholar</span>
            <input
              type="text"
              onChange={(e) => handleChange("googleScholar", e.target.value)}
              onPaste={handlePaste("googleScholar")}
              value={socialLinks.googleScholar}
              className="text-[#09090B] text-sm font-medium bg-transparent outline-none ml-1 flex-1 placeholder-[#71717A]"
              placeholder="Enter URL"
            />
          </div>

          {/* ResearchGate */}
          <div className="flex items-center border border-[#e4e4e7] rounded-[8px] px-4 py-3">
            <div className="w-6 h-6 mr-2 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" aria-label="Research Gate" role="img" viewBox="0 0 512 512" className="w-6 h-6">
                <rect width="512" height="512" rx="15%" fill="#00d0af"/>
                <g fill="#feffff">
                  <path d="m271 383c-15-4-23-10-36-26-9-12-26-39-35-53l-6-11h-24l0 34c1 43 0 42 19 45l10 1 0 4 0 4h-80l0-4c0-4 1-4 9-6 10-2 14-5 15-14 1-4 1-31 1-79-0-70-1-72-3-77-3-5-7-7-18-8-4-1-5-1-5-5v-4l43-1c55-1 65 0 81 11 15 10 22 24 20 43-1 21-17 42-37 50-4 1-7 3-7 3 0 2 17 28 28 43 15 21 27 32 36 37 4 2 9 3 10 3 3 0 3 1 3 4 0 3-1 5-2 5-5 2-19 2-26 0zm-57-109c14-7 22-18 23-35 1-13-2-22-10-30-9-10-25-14-48-12l-10 1v39c0 36 0 40 2 40 1 0 9 1 18 0 14-0 17-1 24-4z"/>
                  <path d="m321 228c-25-4-34-20-32-61 1-21 3-30 11-38 7-7 13-9 25-10 13-1 21 2 29 8 5 4 9 10 9 13 0 1-3 2-6 4l-6 3-3-3c-5-6-9-9-14-11-10-3-20 2-25 11-3 5-3 6-3 29 0 22 0 25 3 29 4 7 12 11 21 10 13-1 20-10 20-24v-7l-10-0-10-0v-13h36l-0 15c-0 12-1 16-3 22-6 15-23 24-42 22z"/>
                </g>
              </svg>
            </div>
            <span className="text-[#a1a1aa] text-sm font-normal">researchgate.net/profile/</span>
            <input
              type="text"
              onChange={(e) => handleChange("researchGate", e.target.value)}
              onPaste={handlePaste("researchGate")}
              value={socialLinks.researchGate}
              className="text-[#09090B] text-sm font-medium bg-transparent outline-none flex-1 placeholder-[#71717A]"
              placeholder="Your username"
            />
          </div>

          {/* ORCID */}
          <div className="flex items-center border border-[#e4e4e7] rounded-[8px] px-4 py-3">
            <div className="w-6 h-6 mr-2 flex items-center justify-center">
              <img src="https://upload.wikimedia.org/wikipedia/commons/0/06/ORCID_iD.svg" alt="ORCID Icon" className="w-6 h-6" />
            </div>
            <span className="text-[#a1a1aa] text-sm font-normal">orcid.org/</span>
            <input
              type="text"
              onChange={(e) => handleChange("orcid", e.target.value)}
              onPaste={handlePaste("orcid")}
              value={socialLinks.orcid}
              className="text-[#09090B] text-sm font-medium bg-transparent outline-none flex-1 placeholder-[#71717A]"
              placeholder="Your ORCID ID"
            />
          </div>

          {/* GitHub */}
          <div className="flex items-center border border-[#e4e4e7] rounded-[8px] px-4 py-3">
            <div className="w-6 h-6 mr-2">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6"
              >
                <path
                  d="M0 12.3038C0 5.50847 5.3735 0 12.0001 0C18.6273 0 24 5.50847 24 12.3038C24 17.7381 20.566 22.3485 15.8006 23.9772C15.1923 24.098 14.9763 23.7144 14.9763 23.387C14.9763 23.2527 14.9778 23.0174 14.9799 22.7029C14.984 22.0683 14.9902 21.1108 14.9902 20.0105C14.9902 18.8626 14.6067 18.1138 14.1762 17.732C16.8484 17.4274 19.6557 16.3869 19.6557 11.6612C19.6557 10.3179 19.1901 9.22032 18.4206 8.35868C18.5452 8.04878 18.9562 6.79737 18.303 5.10261C18.303 5.10261 17.2967 4.77193 15.0063 6.3638C14.0473 6.09119 13.0199 5.95447 12.0001 5.94979C10.9803 5.95447 9.95372 6.09119 8.9965 6.3638C6.70331 4.77193 5.69562 5.10261 5.69562 5.10261C5.04402 6.79737 5.45477 8.04878 5.57937 8.35868C4.81172 9.22032 4.34295 10.3179 4.34295 11.6612C4.34295 16.3757 7.14486 17.4307 9.81024 17.7418C9.46706 18.049 9.15607 18.5918 9.04836 19.387C8.36359 19.7014 6.6266 20.2452 5.55632 18.3642C5.55632 18.3642 4.92181 17.1831 3.7168 17.0963C3.7168 17.0963 2.54596 17.0806 3.63473 17.8443C3.63473 17.8443 4.42125 18.2224 4.96712 19.6446C4.96712 19.6446 5.67157 21.8405 9.01001 21.0963C9.01282 21.655 9.01739 22.1964 9.02097 22.6213C9.02399 22.978 9.02631 23.2531 9.02631 23.387C9.02631 23.7119 8.80613 24.0927 8.2064 23.9789C3.43839 22.3519 0 17.74 0 12.3038Z"
                  fill="#161514"
                />
                <path
                  d="M4.37526 17.6182C4.46055 17.6598 4.55417 17.6416 4.58055 17.5811C4.6107 17.5204 4.56111 17.437 4.47403 17.3973C4.38736 17.3555 4.29354 17.3729 4.26775 17.4352C4.23959 17.496 4.28838 17.5785 4.37526 17.6182Z"
                  fill="#161514"
                />
                <path
                  d="M5.06491 18.1315C5.00779 18.1854 4.89612 18.1603 4.82035 18.0752C4.742 17.9903 4.72733 17.8767 4.78524 17.822C4.84415 17.7682 4.95245 17.7934 5.031 17.8783C5.10934 17.9643 5.12462 18.077 5.06491 18.1315Z"
                  fill="#161514"
                />
                <path
                  d="M5.26969 18.7281C5.34387 18.8364 5.46387 18.8851 5.53726 18.8332C5.61223 18.7802 5.61223 18.6502 5.53904 18.5401C5.46387 18.4326 5.34566 18.3858 5.27128 18.4378C5.1963 18.4899 5.1963 18.6198 5.26969 18.7281Z"
                  fill="#161514"
                />
                <path
                  d="M6.18439 19.511C6.11874 19.5846 5.9789 19.5648 5.87656 19.4644C5.77183 19.3661 5.74267 19.2267 5.80852 19.1531C5.87497 19.0793 6.0156 19.1 6.11874 19.1997C6.22267 19.2977 6.25441 19.4381 6.18439 19.511Z"
                  fill="#161514"
                />
                <path
                  d="M6.77789 20.0028C6.91356 20.0433 7.04824 19.9999 7.0772 19.9045C7.10537 19.8075 7.01651 19.6965 6.88123 19.655C6.74457 19.6116 6.6093 19.6568 6.58113 19.7528C6.55376 19.8492 6.64242 19.961 6.77789 20.0028Z"
                  fill="#161514"
                />
                <path
                  d="M8.05768 19.9776C8.06105 20.0781 7.94601 20.1614 7.8036 20.1632C7.66039 20.1664 7.54456 20.0851 7.54297 19.9863C7.54297 19.8848 7.65543 19.8023 7.79864 19.7999C7.94105 19.7971 8.05768 19.8777 8.05768 19.9776Z"
                  fill="#161514"
                />
                <path
                  d="M8.74633 20.0451C8.88775 20.0183 8.98673 19.9176 8.96967 19.8196C8.95162 19.7199 8.82488 19.661 8.68326 19.686C8.54441 19.7121 8.44365 19.8127 8.46091 19.9132C8.47856 20.0104 8.60729 20.071 8.74633 20.0451Z"
                  fill="#161514"
                />
              </svg>
            </div>
            <span className="text-[#a1a1aa] text-sm font-normal">github.com/</span>
            <input
              type="text"
              onChange={(e) => handleChange("github", e.target.value)}
              onPaste={handlePaste("github")}
              value={socialLinks.github}
              className="text-[#09090B] text-sm font-medium bg-transparent outline-none flex-1 placeholder-[#71717A]"
              placeholder="Your username"
            />
          </div>

          {/* LinkedIn */}
          <div className="flex items-center border border-[#e4e4e7] rounded-[8px] px-4 py-3">
            <div className="w-6 h-6 mr-2">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6"
              >
                <path
                  d="M0 4C0 1.79086 1.78793 0 3.99346 0H19.5065C21.7121 0 23.5 1.79086 23.5 4V20C23.5 22.2091 21.7121 24 19.5065 24H3.99346C1.78794 24 0 22.2091 0 20V4Z"
                  fill="#0077B5"
                />
                <path
                  d="M16.5432 20.6261H20.0819V13.4775C20.0819 9.94694 17.9481 8.74275 15.9736 8.74275C14.1478 8.74275 12.9075 9.95753 12.565 10.6691V9.06762H9.16185V20.6261H12.7005V14.3595C12.7005 12.6886 13.7298 11.876 14.7799 11.876C15.773 11.876 16.5432 12.4504 16.5432 14.3131V20.6261Z"
                  fill="white"
                />
                <path
                  d="M3.22656 5.36868C3.22656 6.57539 4.13996 7.45723 5.26667 7.45723C6.39354 7.45723 7.30693 6.57539 7.30693 5.36868C7.30693 4.16214 6.39354 3.2793 5.26667 3.2793C4.13996 3.2793 3.22656 4.16214 3.22656 5.36868Z"
                  fill="white"
                />
                <path d="M3.49741 20.6172H7.03592V9.05872H3.49741V20.6172Z" fill="white" />
              </svg>
            </div>
            <span className="text-[#a1a1aa] text-sm font-normal">linkedin.com/in/</span>
            <input
              type="text"
              onChange={(e) => handleChange("linkedin", e.target.value)}
              onPaste={handlePaste("linkedin")}
              value={socialLinks.linkedin}
              className="text-[#09090B] text-sm font-medium bg-transparent outline-none flex-1 placeholder-[#71717A]"
              placeholder="Your username"
            />
          </div>

          {/* Twitter/X */}
          <div className="flex items-center border border-[#e4e4e7] rounded-[8px] px-4 py-3">
            <div className="w-6 h-6 mr-2">
              <svg viewBox="0 0 24 24" className="w-6 h-6">
                <path
                  fill="#000000"
                  d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"
                />
              </svg>
            </div>
            <span className="text-[#a1a1aa] text-sm font-normal">x.com/</span>
            <input
              type="text"
              onChange={(e) => handleChange("twitter", e.target.value)}
              onPaste={handlePaste("twitter")}
              value={socialLinks.twitter}
              className="text-[#09090B] text-sm font-medium bg-transparent outline-none flex-1 placeholder-[#71717A]"
              placeholder="Your username"
            />
          </div>

          {/* YouTube */}
          <div className="flex items-center border border-[#e4e4e7] rounded-[8px] px-4 py-3">
            <div className="w-6 h-6 mr-2">
              <svg viewBox="0 0 24 24" className="w-6 h-6">
                <path
                  fill="#ff0000"
                  d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
                />
              </svg>
            </div>
            <span className="text-[#a1a1aa] text-sm font-normal">youtube.com/@</span>
            <input
              type="text"
              onChange={(e) => handleChange("youtube", e.target.value)}
              onPaste={handlePaste("youtube")}
              value={socialLinks.youtube}
              className="text-[#09090B] text-sm font-medium bg-transparent outline-none flex-1 placeholder-[#71717A]"
              placeholder="Your username"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
