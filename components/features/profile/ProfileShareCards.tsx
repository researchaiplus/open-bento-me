'use client'

import { forwardRef, useMemo } from "react"
import { QRCodeSVG } from "qrcode.react"
import { cn } from "@/lib/utils"
import type { SocialLinks } from "@/types/social-links"
import { buildSocialUrl } from "@/lib/socialLinks"

const svgPaths = {
  p10829100: "M13.9091 1.23058V6.54875L18 3.48057V1.84422C18 0.327512 16.2685 -0.538738 15.0545 0.371489L13.9091 1.23058Z",
  p1301bc0:
    "M14 10V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V10M4.66667 6.66667L8 10M8 10L11.3333 6.66667M8 10V2",
  p1da30500: "M0 1.84422V3.48056L4.09091 6.54874V1.23057L2.94545 0.371489C1.73148 -0.538738 0 0.327512 0 1.84422Z",
  p1df30c00: "M4.63829 14.6332C4.58905 14.6885 4.48418 14.6736 4.40742 14.5983C4.32887 14.5246 4.30701 14.42 4.35639 14.3648C4.40623 14.3094 4.5117 14.325 4.58905 14.3998C4.66701 14.4733 4.69081 14.5786 4.63829 14.6332Z",
  p1ea87300: "M3.95227 14.0461C4.0079 14.1273 4.0979 14.1638 4.15294 14.1249C4.20918 14.0851 4.20918 13.9877 4.15428 13.9051C4.0979 13.8244 4.00924 13.7893 3.95346 13.8284C3.89723 13.8674 3.89723 13.9648 3.95227 14.0461Z",
  p2140d300: "M3.79868 13.5986C3.75584 13.639 3.67209 13.6203 3.61526 13.5564C3.5565 13.4927 3.54549 13.4075 3.58893 13.3665C3.63311 13.3261 3.71434 13.345 3.77325 13.4087C3.83201 13.4732 3.84346 13.5578 3.79868 13.5986Z",
  p21a38e80:
    "M18 9C18 13.9706 13.9706 18 9 18C4.02944 18 0 13.9706 0 9C0 4.02944 4.02944 0 9 0C13.9706 0 18 4.02944 18 9ZM4.27171 5.71274C4.3817 5.81421 4.43788 5.96322 4.42297 6.11398V11.5421C4.45561 11.7379 4.39529 11.9379 4.2605 12.0809L3 13.6457V13.8521H6.57423V13.6457L5.31373 12.0809C5.17795 11.9382 5.1139 11.7395 5.14006 11.5421V6.84766L8.27731 13.8521H8.64146L11.3361 6.84766V12.4306C11.3361 12.5796 11.3361 12.6082 11.2409 12.7057L10.2717 13.6687V13.875H14.9776V13.6687L14.042 12.7286C13.9594 12.6642 13.9185 12.5583 13.9356 12.4535V5.54652C13.9185 5.44171 13.9594 5.33581 14.042 5.27138L15 4.33135V4.125H11.6835L9.31933 10.1607L6.63025 4.125H3.15126V4.33135L4.27171 5.71274Z",
  p22846880: "M4.3956 6.04396L5.49451 7.14286L7.69231 4.94506M11.5385 6.04396C11.5385 9.07849 9.07849 11.5385 6.04396 11.5385C3.00942 11.5385 0.549451 9.07849 0.549451 6.04396C0.549451 3.00942 3.00942 0.549451 6.04396 0.549451C9.07849 0.549451 11.5385 3.00942 11.5385 6.04396Z",
  p30576100:
    "M11.8072 0H14.0964L9.09639 5.75301L15 13.5542H10.3614L6.74699 8.8253L2.59036 13.5542H0.301205L5.66265 7.40964L0 0H4.75904L8.04217 4.33735L11.8072 0ZM10.994 12.1687H12.259L4.06627 1.29518H2.68072L10.994 12.1687Z",
  p34635980:
    "M6.66667 8.66664C6.95297 9.0494 7.31824 9.3661 7.7377 9.59527C8.15716 9.82444 8.62101 9.96072 9.09777 9.99487C9.57453 10.029 10.0531 9.96022 10.5009 9.79316C10.9487 9.62611 11.3554 9.36469 11.6933 9.02664L13.6933 7.02664C14.3005 6.39797 14.6365 5.55596 14.6289 4.68197C14.6213 3.80798 14.2708 2.97194 13.6527 2.35391C13.0347 1.73589 12.1987 1.38532 11.3247 1.37773C10.4507 1.37014 9.60867 1.70612 8.98 2.31331L7.83333 3.45331M9.33347 7.33332C9.04716 6.95057 8.68189 6.63387 8.26243 6.40469C7.84297 6.17552 7.37913 6.03924 6.90237 6.0051C6.4256 5.97095 5.94708 6.03974 5.49924 6.2068C5.0514 6.37386 4.64472 6.63527 4.3068 6.97332L2.3068 8.97332C1.69961 9.60199 1.36363 10.444 1.37122 11.318C1.37881 12.192 1.72938 13.028 2.3474 13.646C2.96543 14.2641 3.80147 14.6146 4.67546 14.6222C5.54945 14.6298 6.39146 14.2938 7.02013 13.6867L8.16013 12.5467",
  p347a7e80:
    "M0 9C0 4.02944 4.02944 0 9 0C13.9706 0 18 4.02944 18 9C18 13.9706 13.9706 18 9 18C4.02944 18 0 13.9706 0 9ZM13.8 8.99335C13.8 8.66849 13.767 8.34363 13.702 8.02834C13.6387 7.71986 13.545 7.41654 13.4222 7.12749C13.3022 6.84291 13.1533 6.5686 12.9794 6.313C12.8081 6.05883 12.6108 5.82103 12.3939 5.60359C12.1767 5.38732 11.9376 5.19097 11.6838 5.01918C11.4273 4.84574 11.1529 4.69712 10.8683 4.57636C10.5784 4.45394 10.2748 4.3601 9.96664 4.29737C9.65021 4.23277 9.32489 4.2 8.9998 4.2C8.67448 4.2 8.34915 4.23277 8.03319 4.29737C7.72449 4.36008 7.42098 4.45392 7.13127 4.57636C6.84673 4.69714 6.57202 4.84574 6.31561 5.01918C6.06177 5.19097 5.82269 5.38732 5.60588 5.60359C5.38885 5.82103 5.19148 6.05883 5.01991 6.313C4.84694 6.5686 4.69785 6.8429 4.57739 7.12749C4.45455 7.41654 4.36058 7.71986 4.29706 8.02834C4.2328 8.34363 4.2 8.66849 4.2 8.99335C4.2 9.31796 4.23282 9.64212 4.29704 9.95811C4.36056 10.2666 4.45454 10.5694 4.57737 10.859C4.69784 11.1433 4.84692 11.4174 5.01989 11.673C5.19146 11.9269 5.38883 12.1652 5.60586 12.3824C5.82267 12.5986 6.06175 12.7955 6.31559 12.9675C6.572 13.1402 6.84671 13.2888 7.13125 13.4094C7.42096 13.5316 7.72449 13.6252 8.03318 13.6884C8.34913 13.7534 8.67446 13.7867 8.99978 13.7867C9.32487 13.7867 9.65021 13.7534 9.96662 13.6884C10.2748 13.6252 10.5784 13.5316 10.8683 13.4094C11.1529 13.2888 11.4273 13.1402 11.6837 12.9675C11.9376 12.7955 12.1767 12.5986 12.3939 12.3824C12.6107 12.1652 12.8081 11.9269 12.9794 11.673C13.1533 11.4174 13.3022 11.1433 13.4222 10.859C13.545 10.5694 13.6387 10.2666 13.702 9.95811C13.767 9.64212 13.8 9.31796 13.8 8.99335Z",
  p3b1e3f80: "M5.08342 15.0021C5.18517 15.0325 5.28618 14.9999 5.3079 14.9284C5.32902 14.8556 5.26238 14.7724 5.16093 14.7412C5.05843 14.7087 4.95698 14.7426 4.93585 14.8146C4.91532 14.8869 4.98182 14.9707 5.08342 15.0021Z",
  p3e42cb00:
    "M9.88179 8.01267C11.5002 7.35264 12.1577 6.40403 12.1654 6.39305C12.7406 7.09027 13.0882 7.98084 13.0976 8.95119C13.0383 8.93903 11.6509 8.64132 10.2427 8.81827C10.2139 8.74807 10.1844 8.67785 10.1541 8.60622C10.0691 8.40655 9.97693 8.20788 9.88179 8.01267ZM11.2905 12.388C11.2487 12.1413 11.0303 10.9397 10.4926 9.46424C11.8157 9.25241 12.9626 9.61496 13.0469 9.64211C12.8646 10.7829 12.2109 11.7678 11.2905 12.388ZM9.7245 9.65383C10.3013 11.1508 10.5395 12.4044 10.6002 12.762C10.1082 12.971 9.56745 13.0864 8.99978 13.0864C8.04911 13.0864 7.17625 12.7604 6.48034 12.2199C6.48889 12.2014 7.27871 10.5047 9.69731 9.66272C9.70624 9.65946 9.71537 9.65685 9.7245 9.65383ZM11.707 5.92121C11.6969 5.93618 11.113 6.8237 9.56629 7.40273C8.86525 6.11735 8.09527 5.09737 8.03387 5.01498C8.34349 4.94055 8.66672 4.90029 8.99978 4.90029C10.0377 4.90029 10.9853 5.28575 11.707 5.92121ZM9.11251 8.27997C9.22993 8.50981 9.34223 8.74293 9.44511 8.97556C9.39121 8.991 9.33682 9.00693 9.28338 9.02471C7.07125 9.73902 5.94945 11.7263 5.95086 11.7284C5.29786 11.0036 4.90057 10.0449 4.90057 8.99335C4.90057 8.94933 4.90268 8.90675 4.90386 8.86275C4.97651 8.86555 7.00186 8.91095 9.11251 8.27997ZM7.25078 5.29091C7.3054 5.36372 8.06341 6.39094 8.77288 7.64966C6.80474 8.17184 5.09653 8.1503 4.98846 8.14936C5.2545 6.88175 6.10766 5.82994 7.25078 5.29091Z",
  p3e625c00: "M6.04326 14.9832C6.04579 15.0586 5.95951 15.121 5.8527 15.1224C5.74529 15.1248 5.65842 15.0638 5.65723 14.9897C5.65723 14.9136 5.74157 14.8517 5.84898 14.8499C5.95579 14.8478 6.04326 14.9083 6.04326 14.9832Z",
  p44f8e80: "M13.9091 13.5033H16.7727C17.4508 13.5033 18 12.9541 18 12.276V3.48057L13.9091 6.54875V13.5033Z",
  p4b88fb0:
    "M6.66663 8.70002C6.95293 9.08278 7.3182 9.39948 7.73766 9.62865C8.15712 9.85781 8.62097 9.99409 9.09773 10.0282C9.5745 10.0624 10.053 9.99359 10.5008 9.82653C10.9486 9.65947 11.3553 9.39806 11.6933 9.06002L13.6933 7.06002C14.3004 6.43135 14.6364 5.58933 14.6288 4.71534C14.6212 3.84136 14.2706 3.00531 13.6526 2.38729C13.0346 1.76926 12.1985 1.41869 11.3245 1.4111C10.4506 1.40351 9.60857 1.73949 8.9799 2.34668L7.83323 3.48668M9.33342 7.3667C9.04711 6.98395 8.68184 6.66724 8.26238 6.43807C7.84292 6.20891 7.37907 6.07263 6.90231 6.03848C6.42554 6.00434 5.94703 6.07312 5.49919 6.24018C5.05135 6.40724 4.64467 6.66866 4.30675 7.0067L2.30675 9.0067C1.69957 9.63537 1.36358 10.4774 1.37117 11.3514C1.37876 12.2254 1.72933 13.0614 2.34735 13.6795C2.96538 14.2975 3.80142 14.6481 4.67541 14.6557C5.5494 14.6633 6.39141 14.3273 7.02008 13.7202L8.16008 12.5802",
  p86671c0:
    "M2.9951 0C1.34095 0 0 1.34315 0 3V15C0 16.6569 1.34095 18 2.9951 18H14.6299C16.284 18 17.625 16.6569 17.625 15V3C17.625 1.34315 16.284 0 14.6299 0H2.9951ZM2.41891 4.0266C2.41891 4.93163 3.10396 5.59301 3.94899 5.59301C4.79415 5.59301 5.47919 4.93163 5.47919 4.0266C5.47919 3.1217 4.79415 2.45956 3.94899 2.45956C3.10396 2.45956 2.41891 3.1217 2.41891 4.0266ZM12.4064 15.4697H15.0604V10.1082C15.0604 7.4603 13.4601 6.55716 11.9792 6.55716C10.6098 6.55716 9.67959 7.46824 9.42276 8.00193V6.80081H6.87038V15.4697H9.52439V10.7697C9.52439 9.51653 10.2964 8.90708 11.0839 8.90708C11.8288 8.90708 12.4064 9.33792 12.4064 10.7349V15.4697ZM5.27594 6.79413V15.463H2.62205V6.79413H5.27594Z",
  pbe3b680: "M3.28144 13.2137C3.34541 13.2448 3.41562 13.2312 3.43541 13.1858C3.45802 13.1403 3.42083 13.0778 3.35553 13.048C3.29052 13.0167 3.22015 13.0297 3.20081 13.0764C3.17969 13.122 3.21629 13.1838 3.28144 13.2137Z",
  pc8c9100:
    "M0 9.22785C0 4.13136 4.03012 0 9.00007 0C13.9705 0 18 4.13136 18 9.22785C18 13.3036 15.4245 16.7614 11.8504 17.9829C11.3942 18.0735 11.2322 17.7858 11.2322 17.5402C11.2322 17.4395 11.2334 17.2631 11.2349 17.0272C11.238 16.5512 11.2426 15.8331 11.2426 15.0079C11.2426 14.1469 10.955 13.5854 10.6322 13.299C12.6363 13.0706 14.7417 12.2902 14.7417 8.74589C14.7417 7.73842 14.3925 6.91524 13.8155 6.26901C13.9089 6.03658 14.2171 5.09803 13.7272 3.82696C13.7272 3.82696 12.9725 3.57895 11.2547 4.77285C10.5355 4.56839 9.76493 4.46586 9.00007 4.46234C8.23521 4.46586 7.46529 4.56839 6.74737 4.77285C5.02748 3.57895 4.27171 3.82696 4.27171 3.82696C3.78302 5.09803 4.09108 6.03658 4.18453 6.26901C3.60879 6.91524 3.25721 7.73842 3.25721 8.74589C3.25721 12.2818 5.35864 13.073 7.35768 13.3063C7.10029 13.5368 6.86705 13.9439 6.78627 14.5403C6.27269 14.7761 4.96995 15.1839 4.16724 13.7732C4.16724 13.7732 3.69136 12.8873 2.7876 12.8222C2.7876 12.8222 1.90947 12.8105 2.72604 13.3832C2.72604 13.3832 3.31593 13.6668 3.72534 14.7334C3.72534 14.7334 4.25368 16.3804 6.75751 15.8222C6.75961 16.2413 6.76304 16.6473 6.76573 16.966C6.76799 17.2335 6.76973 17.4398 6.76973 17.5402C6.76973 17.784 6.60459 18.0696 6.1548 17.9841C2.57879 16.764 0 13.305 0 9.22785Z",
  pd90bef1: "M4.09091 6.54874V1.23057L9 4.91239L13.9091 1.23058V6.54875L9 10.2306L4.09091 6.54874Z",
  peb13900: "M1.22727 13.5033H4.09091V6.54874L0 3.48056V12.276C0 12.9541 0.549205 13.5033 1.22727 13.5033Z",
  pf4ec480: "M6.55975 15.0339C6.66581 15.0137 6.74005 14.9382 6.72725 14.8647C6.71372 14.79 6.61866 14.7458 6.51244 14.7645C6.40831 14.784 6.33274 14.8595 6.34568 14.9349C6.35892 15.0078 6.45547 15.0532 6.55975 15.0339Z",
  pfda8300: "M13.3072 2.25H15.5964L10.5964 8.00301L16.5 15.8042H11.8614L8.24699 11.0753L4.09036 15.8042H1.8012L7.16265 9.65964L1.5 2.25H6.25904L9.54217 6.58735L13.3072 2.25ZM12.494 14.4187H13.759L5.56627 3.54518H4.18072L12.494 14.4187Z",
}

interface BaseCardProps {
  name: string
  username: string
  profileUrl: string
  bio?: string
  avatarUrl?: string
  offerings?: string[]
  seeking?: string[]
  socialLinks?: SocialLinks
  onCopyLink?: () => void
  onDownloadImage?: () => void
  className?: string
}

const FALLBACK_BIO =
  ""
const FALLBACK_URL = "https://researchernexus.com"

const cardShellClasses =
  "bg-white box-border flex items-center justify-center gap-[10px] overflow-clip rounded-[20px] p-[24px] w-[375px] max-w-full"

const contentWidthClass = "w-[327px]"

const iconButtonClasses =
  "bg-neutral-100 box-border content-stretch flex flex-col gap-[10px] items-center justify-center px-[12px] py-0 relative rounded-[24px] shrink-0 size-[32px] hover:bg-neutral-200 transition-colors cursor-pointer"

const socialIconWrapper = "relative shrink-0 size-[18px]"

const SocialIcon = ({ pathKey }: { pathKey: keyof typeof svgPaths }) => (
  <div className={socialIconWrapper} aria-hidden>
    <svg viewBox="0 0 18 18" className="block size-full" fill="none" preserveAspectRatio="none">
      <path d={svgPaths[pathKey]} fill="var(--fill-0, #020617)" clipRule="evenodd" fillRule="evenodd" />
    </svg>
  </div>
)

const SocialLinks = ({ socialLinks }: { socialLinks?: SocialLinks }) => {
  if (!socialLinks) {
    // Fallback to hardcoded icons if no socialLinks provided (backward compatibility)
    return (
      <div className="content-center flex flex-wrap gap-[10px] items-center relative shrink-0 w-full">
        <div className={socialIconWrapper}>
          <svg viewBox="0 0 18 14" className="block size-full" fill="none" preserveAspectRatio="none">
            <path d={svgPaths.peb13900} fill="#020617" />
            <path d={svgPaths.p44f8e80} fill="var(--fill-0, #020617)" />
            <path d={svgPaths.p10829100} fill="var(--fill-0, #020617)" />
            <path d={svgPaths.pd90bef1} fill="var(--fill-0, #020617)" clipRule="evenodd" fillRule="evenodd" />
            <path d={svgPaths.p1da30500} fill="var(--fill-0, #020617)" />
          </svg>
        </div>
        <SocialIcon pathKey="p86671c0" />
        <div className={socialIconWrapper}>
          <svg viewBox="0 0 18 18" className="block size-full" fill="none" preserveAspectRatio="none">
            <path d={svgPaths.pfda8300} fill="var(--fill-0, #020617)" />
          </svg>
        </div>
        <div className={socialIconWrapper}>
          <svg viewBox="0 0 18 18" className="block size-full" fill="none" preserveAspectRatio="none">
            <g>
              <path d={svgPaths.pc8c9100} fill="var(--fill-0, #161514)" />
              <path d={svgPaths.pbe3b680} fill="var(--fill-0, #161514)" />
              <path d={svgPaths.p2140d300} fill="var(--fill-0, #161514)" />
              <path d={svgPaths.p1ea87300} fill="var(--fill-0, #161514)" />
              <path d={svgPaths.p1df30c00} fill="var(--fill-0, #161514)" />
              <path d={svgPaths.p3b1e3f80} fill="var(--fill-0, #161514)" />
              <path d={svgPaths.p3e625c00} fill="var(--fill-0, #161514)" />
              <path d={svgPaths.pf4ec480} fill="var(--fill-0, #161514)" />
            </g>
          </svg>
        </div>
        <SocialIcon pathKey="p21a38e80" />
        <div className={socialIconWrapper}>
          <svg viewBox="0 0 18 18" className="block size-full" fill="none" preserveAspectRatio="none">
            <path d={svgPaths.p347a7e80} fill="#020617" clipRule="evenodd" fillRule="evenodd" />
            <path d={svgPaths.p3e42cb00} fill="#020617" clipRule="evenodd" fillRule="evenodd" />
          </svg>
        </div>
      </div>
    )
  }

  // Filter out empty social links and render only those with values
  const hasEmail = socialLinks.email?.trim()
  const hasLinkedIn = socialLinks.linkedin?.trim()
  const hasTwitter = socialLinks.twitter?.trim()
  const hasGithub = socialLinks.github?.trim()
  const hasGoogleScholar = socialLinks.googleScholar?.trim()
  const hasResearchGate = socialLinks.researchGate?.trim()
  const hasOrcid = socialLinks.orcid?.trim()
  const hasBluesky = socialLinks.bluesky?.trim()
  const hasMedium = socialLinks.medium?.trim()
  const hasYoutube = socialLinks.youtube?.trim()
  const hasSpotify = socialLinks.spotify?.trim()
  const hasDiscord = socialLinks.discord?.trim()

  const links: Array<{ key: string; url: string; icon: JSX.Element }> = []

  if (hasEmail) {
    links.push({
      key: 'email',
      url: buildSocialUrl('email', socialLinks.email),
      icon: (
        <div className={socialIconWrapper}>
          <svg viewBox="0 0 18 14" className="block size-full" fill="none" preserveAspectRatio="none">
            <path d={svgPaths.peb13900} fill="#020617" />
            <path d={svgPaths.p44f8e80} fill="var(--fill-0, #020617)" />
            <path d={svgPaths.p10829100} fill="var(--fill-0, #020617)" />
            <path d={svgPaths.pd90bef1} fill="var(--fill-0, #020617)" clipRule="evenodd" fillRule="evenodd" />
            <path d={svgPaths.p1da30500} fill="var(--fill-0, #020617)" />
          </svg>
        </div>
      ),
    })
  }

  if (hasLinkedIn) {
    links.push({
      key: 'linkedin',
      url: buildSocialUrl('linkedin', socialLinks.linkedin),
      icon: <SocialIcon pathKey="p86671c0" />,
    })
  }

  if (hasTwitter) {
    links.push({
      key: 'twitter',
      url: buildSocialUrl('twitter', socialLinks.twitter),
      icon: (
        <div className={socialIconWrapper}>
          <svg viewBox="0 0 18 18" className="block size-full" fill="none" preserveAspectRatio="none">
            <path d={svgPaths.pfda8300} fill="var(--fill-0, #020617)" />
          </svg>
        </div>
      ),
    })
  }

  if (hasGithub) {
    links.push({
      key: 'github',
      url: buildSocialUrl('github', socialLinks.github),
      icon: (
        <div className={socialIconWrapper}>
          <svg viewBox="0 0 18 18" className="block size-full" fill="none" preserveAspectRatio="none">
            <g>
              <path d={svgPaths.pc8c9100} fill="var(--fill-0, #161514)" />
              <path d={svgPaths.pbe3b680} fill="var(--fill-0, #161514)" />
              <path d={svgPaths.p2140d300} fill="var(--fill-0, #161514)" />
              <path d={svgPaths.p1ea87300} fill="var(--fill-0, #161514)" />
              <path d={svgPaths.p1df30c00} fill="var(--fill-0, #161514)" />
              <path d={svgPaths.p3b1e3f80} fill="var(--fill-0, #161514)" />
              <path d={svgPaths.p3e625c00} fill="var(--fill-0, #161514)" />
              <path d={svgPaths.pf4ec480} fill="var(--fill-0, #161514)" />
            </g>
          </svg>
        </div>
      ),
    })
  }

  if (hasGoogleScholar) {
    links.push({
      key: 'googleScholar',
      url: buildSocialUrl('googleScholar', socialLinks.googleScholar),
      icon: (
        <div className={socialIconWrapper}>
          <div className="w-full h-full flex items-center justify-center bg-black rounded-full">
            <span className="text-white font-semibold text-[10px] leading-none">G</span>
          </div>
        </div>
      ),
    })
  }

  if (hasResearchGate) {
    links.push({
      key: 'researchGate',
      url: buildSocialUrl('researchGate', socialLinks.researchGate),
      icon: (
        <div className={socialIconWrapper}>
          <svg viewBox="0 0 18 18" className="block size-full" fill="none" preserveAspectRatio="none">
            <path d={svgPaths.p347a7e80} fill="#020617" clipRule="evenodd" fillRule="evenodd" />
            <path d={svgPaths.p3e42cb00} fill="#020617" clipRule="evenodd" fillRule="evenodd" />
          </svg>
        </div>
      ),
    })
  }

  if (hasOrcid) {
    links.push({
      key: 'orcid',
      url: buildSocialUrl('orcid', socialLinks.orcid),
      icon: (
        <div className={socialIconWrapper}>
          <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className="block size-full">
            <path fill="#000000" d="M16 0c-8.839 0-16 7.161-16 16s7.161 16 16 16c8.839 0 16-7.161 16-16s-7.161-16-16-16z" />
            <path fill="white" d="M9.823 5.839c0.704 0 1.265 0.573 1.265 1.26 0 0.688-0.561 1.265-1.265 1.265-0.692-0.004-1.26-0.567-1.26-1.265 0-0.697 0.563-1.26 1.26-1.26z" />
            <path fill="white" d="M8.864 9.885h1.923v13.391h-1.923z" />
            <path fill="white" d="M13.615 9.885h5.197c4.948 0 7.125 3.541 7.125 6.703 0 3.439-2.687 6.699-7.099 6.699h-5.224zM15.536 11.625v9.927h3.063c4.365 0 5.365-3.312 5.365-4.964 0-2.687-1.713-4.963-5.464-4.963z" />
          </svg>
        </div>
      ),
    })
  }

  if (hasBluesky) {
    links.push({
      key: 'bluesky',
      url: buildSocialUrl('bluesky', socialLinks.bluesky),
      icon: (
        <div className={socialIconWrapper}>
          <svg viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg" fill="#000000" className="block size-full">
            <path d="M16.89183333333333 13.580879166666666c-0.13474999999999998 -0.01633333333333333 -0.2735833333333333 -0.03266666666666666 -0.4083333333333333 -0.05308333333333333 0.1388333333333333 0.01633333333333333 0.2735833333333333 0.03675 0.4083333333333333 0.05308333333333333ZM12 10.820545833333334c-1.06575 -2.0702499999999997 -3.9649166666666664 -5.928999999999999 -6.659916666666666 -7.831833333333333 -2.5847499999999997 -1.8252499999999998 -3.568833333333333 -1.5108333333333333 -4.2180833333333325 -1.2168333333333332C0.37474999999999997 2.1107958333333334 0.24 3.2582125 0.24 3.9319624999999996s0.37158333333333327 5.537 0.6124999999999999 6.3495833333333325c0.7962499999999999 2.6827499999999995 3.6382499999999998 3.58925 6.2556666666666665 3.29525 0.13474999999999998 -0.020416666666666666 0.26949999999999996 -0.03675 0.4083333333333333 -0.05716666666666667 -0.13474999999999998 0.020416666666666666 -0.26949999999999996 0.04083333333333333 -0.4083333333333333 0.05716666666666667 -3.83425 0.5716666666666667 -7.239749999999999 1.9681666666666664 -2.7725833333333334 6.937583333333333 4.91225 5.087833333333333 6.729333333333333 -1.09025 7.664416666666666 -4.222166666666666 0.9350833333333333 3.1319166666666662 2.009 9.085416666666667 7.578666666666667 4.222166666666666 4.181333333333333 -4.222166666666666 1.1474166666666665 -6.369999999999999 -2.686833333333333 -6.937583333333333 -0.13474999999999998 -0.01633333333333333 -0.2735833333333333 -0.03266666666666666 -0.4083333333333333 -0.05308333333333333 0.1388333333333333 0.01633333333333333 0.2735833333333333 0.03675 0.4083333333333333 0.05308333333333333 2.6174166666666663 0.28991666666666666 5.455333333333333 -0.6165833333333333 6.2556666666666665 -3.29525 0.24091666666666667 -0.8125833333333332 0.6124999999999999 -5.67175 0.6124999999999999 -6.3495833333333325s-0.13474999999999998 -1.8252499999999998 -0.8819999999999999 -2.160083333333333c-0.6451666666666667 -0.28991666666666666 -1.6333333333333333 -0.6084166666666666 -4.2139999999999995 1.2168333333333332 -2.6990833333333333 1.9028333333333332 -5.59825 5.761583333333332 -6.664 7.831833333333333Z" fill="#000000" strokeWidth="0.0417"></path>
          </svg>
        </div>
      ),
    })
  }

  if (hasMedium) {
    links.push({
      key: 'medium',
      url: buildSocialUrl('medium', socialLinks.medium),
      icon: (
        <div className={socialIconWrapper}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="block size-full">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24Z"
              fill="#000000"
            />
            <path
              d="M5.89729 8.15197C5.91717 7.95096 5.84227 7.75228 5.69561 7.61699L4.20168 5.77513V5.5H8.84034L12.4258 13.5476L15.578 5.5H20V5.77513L18.7227 7.02851C18.6126 7.11442 18.5579 7.25561 18.5808 7.39536V16.6046C18.5579 16.7444 18.6126 16.8856 18.7227 16.9715L19.9701 18.2249V18.5H13.6956V18.2249L14.9879 16.9409C15.1148 16.811 15.1148 16.7728 15.1148 16.5741V9.13022L11.5219 18.4694H11.0364L6.85341 9.13022V15.3895C6.81853 15.6526 6.90393 15.9176 7.08497 16.1079L8.76564 18.1943V18.4694H4V18.1943L5.68067 16.1079C5.86039 15.9173 5.94081 15.6506 5.89729 15.3895V8.15197Z"
              fill="white"
            />
          </svg>
        </div>
      ),
    })
  }

  if (hasYoutube) {
    links.push({
      key: 'youtube',
      url: buildSocialUrl('youtube', socialLinks.youtube),
      icon: (
        <div className={socialIconWrapper}>
          <svg viewBox="0 0 24 24" fill="#000000" className="block size-full">
            <path d="M21.58 7.19c-.23-.86-.91-1.54-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42c-.86.23-1.54.91-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81c.23.86.91 1.54 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42c.86-.23 1.54-.91 1.77-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81zM9.5 15.5v-7l6 3.5-6 3.5z" />
          </svg>
        </div>
      ),
    })
  }

  if (hasSpotify) {
    links.push({
      key: 'spotify',
      url: buildSocialUrl('spotify', socialLinks.spotify),
      icon: (
        <div className={socialIconWrapper}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="block size-full">
            <path
              d="M11.9633 0C5.35629 0 0 5.35614 0 11.9631C0 18.5704 5.35629 23.9261 11.9633 23.9261C18.571 23.9261 23.9267 18.5704 23.9267 11.9631C23.9267 5.35657 18.571 0.000571425 11.9631 0.000571425L11.9633 0ZM17.4496 17.2543C17.2353 17.6057 16.7753 17.7171 16.4239 17.5014C13.615 15.7857 10.079 15.3971 5.91471 16.3486C5.51343 16.44 5.11343 16.1886 5.022 15.7871C4.93014 15.3857 5.18057 14.9857 5.58286 14.8943C10.14 13.8527 14.049 14.3014 17.2024 16.2286C17.5539 16.4443 17.6653 16.9029 17.4496 17.2543ZM18.9139 13.9964C18.6439 14.4357 18.0696 14.5743 17.631 14.3043C14.4153 12.3273 9.51343 11.7549 5.70986 12.9094C5.21657 13.0584 4.69557 12.7804 4.54586 12.288C4.39743 11.7947 4.67543 11.2747 5.16786 11.1247C9.51257 9.80643 14.9139 10.445 18.6067 12.7143C19.0453 12.9843 19.1839 13.5584 18.9139 13.9964ZM19.0396 10.6044C15.1839 8.31429 8.82243 8.10371 5.14114 9.221C4.55 9.40029 3.92486 9.06657 3.74571 8.47543C3.56657 7.884 3.9 7.25929 4.49157 7.07957C8.71743 5.79671 15.7424 6.04457 20.1816 8.67986C20.7144 8.99543 20.8887 9.68214 20.573 10.2131C20.2587 10.7449 19.5701 10.9201 19.0401 10.6044H19.0396Z"
              fill="#000000"
            />
          </svg>
        </div>
      ),
    })
  }

  if (hasDiscord) {
    links.push({
      key: 'discord',
      url: buildSocialUrl('discord', socialLinks.discord),
      icon: (
        <div className={socialIconWrapper}>
          <svg viewBox="0 0 24 24" fill="#000000" className="block size-full">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
          </svg>
        </div>
      ),
    })
  }

  if (links.length === 0) {
    return null
  }

  return (
    <div className="content-center flex flex-wrap gap-[10px] items-center relative shrink-0 w-full">
      {links.map((link) => (
        <a
          key={link.key}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-opacity hover:opacity-70"
          aria-label={link.key}
        >
          {link.icon}
        </a>
      ))}
    </div>
  )
}

const CircleCheck = () => (
  <svg viewBox="0 0 13 13" className="block h-3 w-3" fill="none">
    <path d={svgPaths.p22846880} stroke="#FAFAFA" strokeWidth={1.1} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const Avatar = ({ avatarUrl, name }: { avatarUrl?: string; name: string }) => {
  const initials = (name?.trim().charAt(0) || "R").toUpperCase()
  return (
    <div className="content-stretch flex gap-[5.714px] items-center relative shrink-0 size-[100px]">
      <div className="basis-0 grow h-[100px] min-h-px min-w-px relative rounded-[57.143px] shrink-0">
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[57.143px]">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={`${name}'s avatar`}
              className="absolute h-[103.01%] left-[-8.99%] max-w-none top-0 w-[109.02%]"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-300 to-neutral-100 text-[36px] font-semibold text-neutral-700">
              {initials}
            </div>
          )}
        </div>
      </div>
      <span className="absolute bg-neutral-900 box-border content-stretch flex gap-[4px] h-[24.176px] items-center justify-center left-[74.73px] px-[10px] py-[2px] rounded-[36.364px] top-[75.82px] w-[25.275px]">
        <CircleCheck />
      </span>
    </div>
  )
}

const TagContainer = ({ children }: { children: string }) => (
  <div className="content-stretch flex gap-[10px] items-center overflow-clip relative shrink-0">
    <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-neutral-900 text-nowrap">
      <p className="leading-[16px] whitespace-pre">{children}</p>
    </div>
  </div>
)

const Tag = ({ children }: { children: string }) => (
  <div className="bg-white box-border content-stretch flex gap-[8px] items-center px-[10px] py-[8px] relative rounded-[20px] shrink-0">
    <div
      aria-hidden
      className="absolute border border-[rgba(0,0,0,0.06)] border-solid inset-0 pointer-events-none rounded-[20px]"
    />
    <TagContainer>{children}</TagContainer>
  </div>
)

const SectionHeading = ({ emoji, label }: { emoji: string; label: string }) => (
  <div className="content-stretch flex gap-[10px] items-center justify-center leading-[0] not-italic relative shrink-0 text-nowrap">
    <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center relative shrink-0 text-[12px] text-neutral-950">
      <p className="leading-[16px] text-nowrap whitespace-pre">{emoji}</p>
    </div>
    <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center relative shrink-0 text-[#838383] text-[14px]">
      <p className="leading-[20px] text-nowrap whitespace-pre">{label}</p>
    </div>
  </div>
)

const TagList = ({ tags }: { tags: string[] }) => {
  // Limit to 2 tags to fit in 2 rows
  const maxVisibleTags = 2
  const visibleTags = tags.slice(0, maxVisibleTags)
  const remainingCount = tags.length - maxVisibleTags

  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0 w-full">
      <div className="basis-0 content-center flex flex-wrap gap-[8px] grow items-center min-h-px min-w-px relative shrink-0 max-h-[72px] overflow-hidden">
        {visibleTags.map((item) => (
          <Tag key={item}>{item}</Tag>
        ))}
        {remainingCount > 0 && (
          <Tag key={`more-${remainingCount}`}>+{remainingCount} more</Tag>
        )}
      </div>
    </div>
  )
}

const SectionWrapper = ({ emoji, label, tags }: { emoji: string; label: string; tags: string[] }) => (
  <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
    <SectionHeading emoji={emoji} label={label} />
    <TagList tags={tags} />
  </div>
)

const NeedBoard = ({ offerings, seeking }: { offerings?: string[]; seeking?: string[] }) => {
  const hasOfferings = offerings && offerings.length > 0
  const hasSeeking = seeking && seeking.length > 0
  if (!hasOfferings && !hasSeeking) return null
  return (
    <div className="bg-[#f9f9f9] relative rounded-[12px] shrink-0 w-full">
      <div className="flex flex-col justify-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex flex-col gap-[24px] items-start justify-center px-[16px] py-[20px] relative w-full">
          {hasSeeking && <SectionWrapper emoji="🔍" label="Seeking" tags={seeking!} />}
          {hasOfferings && <SectionWrapper emoji="🤝" label="Offering" tags={offerings!} />}
        </div>
      </div>
      <div
        aria-hidden
        className="absolute border border-neutral-200 border-solid inset-0 pointer-events-none rounded-[12px]"
      />
    </div>
  )
}

/** URL display: full text with break-all so long URLs wrap to multiple lines */
const Url = ({ url }: { url: string }) => (
  <div className="content-stretch flex min-w-0 flex-1 flex-col gap-[8px] items-start relative shrink-0 w-full">
    <p className="font-['Inter:Regular',sans-serif] font-normal text-[14px] text-neutral-900 leading-[20px] w-full break-all">
      {url}
    </p>
  </div>
)

const FooterLeft = ({ displayUrl }: { displayUrl: string }) => (
  <div className="basis-0 content-stretch flex min-w-0 flex-col grow items-start justify-between min-h-px relative shrink-0">
    <Url url={displayUrl} />
    <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-neutral-500 w-full">
      <p className="leading-[20px]">Scan to view profile</p>
    </div>
  </div>
)

const Footer = ({ profileUrl }: { profileUrl: string }) => {
  const safeUrl = profileUrl || FALLBACK_URL
  const displayUrl = useMemo(() => safeUrl.replace(/^https?:\/\//, ""), [safeUrl])

  return (
    <div className="content-stretch flex items-start justify-between gap-2 relative shrink-0 w-full">
      <FooterLeft displayUrl={displayUrl} />
      <div className="relative rounded-[12px] shrink-0 size-[80px]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[12px]">
          <QRCodeSVG value={safeUrl} size={80} bgColor="transparent" level="H" />
        </div>
      </div>
    </div>
  )
}

const HeaderActions = ({ onCopyLink, onDownloadImage }: Pick<BaseCardProps, "onCopyLink" | "onDownloadImage">) => (
  <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
    {onCopyLink && (
      <button type="button" className={iconButtonClasses} onClick={onCopyLink} aria-label="Copy profile link">
        <div className="relative shrink-0 size-[16px]">
          <svg viewBox="0 0 16 16" className="block size-full" fill="none" preserveAspectRatio="none">
            <g clipPath="url(#clip0_1_2360)" id="link">
              <path d={svgPaths.p34635980} id="Vector" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" />
            </g>
            <defs>
              <clipPath id="clip0_1_2360">
                <rect fill="white" height="16" width="16" />
              </clipPath>
            </defs>
          </svg>
        </div>
      </button>
    )}
    {onDownloadImage && (
      <button
        type="button"
        className="bg-neutral-900 box-border content-stretch flex flex-col gap-[10px] items-center justify-center px-[12px] py-0 relative rounded-[24px] shrink-0 size-[32px] hover:bg-neutral-800 transition-colors cursor-pointer"
        onClick={onDownloadImage}
        aria-label="Download card as image"
      >
        <div className="relative shrink-0 size-[16px]">
          <svg viewBox="0 0 16 16" className="block size-full" fill="none" preserveAspectRatio="none">
            <g id="download">
              <path d={svgPaths.p1301bc0} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </svg>
        </div>
      </button>
    )}
  </div>
)

const IdentityBlock = ({ name, socialLinks }: { name: string; socialLinks?: SocialLinks }) => (
  <div className="basis-0 content-stretch flex flex-col grow items-start justify-between min-h-px min-w-px relative self-stretch shrink-0">
    <div className="content-stretch flex flex-col gap-[9.225px] items-start relative shrink-0 w-full">
      <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[24px] text-black w-full">
        <p className="leading-[1.2]">{name || "Researcher Name"}</p>
      </div>
    </div>
    <SocialLinks socialLinks={socialLinks} />
  </div>
)

const BioBlock = ({ bio }: { bio?: string }) => (
  <div className="content-stretch flex gap-[10px] items-center justify-center max-h-[128px] relative shrink-0 w-full">
    <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.5] line-clamp-5 not-italic relative shrink-0 text-[16px] text-[rgba(0,0,0,0.9)] w-[325px]">
      {bio?.trim() || FALLBACK_BIO}
    </p>
  </div>
)

export const ProfileShareCardLarge = forwardRef<HTMLDivElement, BaseCardProps>(
  (
    { name, bio, avatarUrl, profileUrl, offerings, seeking, socialLinks, onCopyLink, onDownloadImage, className },
    ref,
  ) => (
    <div ref={ref} className={cn(cardShellClasses, className)}>
      <div className={cn("flex flex-col gap-[20px]", contentWidthClass)}>
        <div className="flex flex-col gap-[20px]">
          <div className="flex gap-[62px] items-start">
            <IdentityBlock name={name} socialLinks={socialLinks} />
            <Avatar avatarUrl={avatarUrl} name={name} />
          </div>
          <BioBlock bio={bio} />
          <NeedBoard offerings={offerings} seeking={seeking} />
          <Footer profileUrl={profileUrl} />
        </div>
      </div>
    </div>
  ),
)
ProfileShareCardLarge.displayName = "ProfileShareCardLarge"

export const ProfileShareCardStandard = forwardRef<HTMLDivElement, BaseCardProps>(
  (
    { name, bio, avatarUrl, profileUrl, socialLinks, onCopyLink, onDownloadImage, className },
    ref,
  ) => (
    <div ref={ref} className={cn(cardShellClasses, className)}>
      <div className={cn("flex flex-col gap-[20px]", contentWidthClass)}>
        <div className="flex flex-col gap-[20px]">
          <div className="flex gap-[62px] items-start">
            <IdentityBlock name={name} socialLinks={socialLinks} />
            <Avatar avatarUrl={avatarUrl} name={name} />
          </div>
          <BioBlock bio={bio} />
          <div className="border-t border-[rgba(0,0,0,0.06)]" />
          <Footer profileUrl={profileUrl} />
        </div>
      </div>
    </div>
  ),
)
ProfileShareCardStandard.displayName = "ProfileShareCardStandard"

export const ProfileShareCardCompact = forwardRef<HTMLDivElement, BaseCardProps>(
  ({ name, bio, avatarUrl, profileUrl, socialLinks, className }, ref) => (
    <div ref={ref} className={cn(cardShellClasses, "relative", className)}>
      <div className={cn("flex flex-col gap-[20px]", contentWidthClass)}>
        <div className="flex gap-[62px] items-start">
          <IdentityBlock name={name} socialLinks={socialLinks} />
          <Avatar avatarUrl={avatarUrl} name={name} />
        </div>
        <BioBlock bio={bio} />
        <Footer profileUrl={profileUrl} />
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[20px] border border-[rgba(0,0,0,0.06)] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.04)]" />
    </div>
  ),
)
ProfileShareCardCompact.displayName = "ProfileShareCardCompact"

export type { BaseCardProps as ProfileShareCardProps }
