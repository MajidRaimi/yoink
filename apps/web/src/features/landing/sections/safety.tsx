import { SAFETY_COPY } from "@/features/landing/copy";
import { SectionHeader } from "@/features/landing/components/section-header";
import { LedgerList } from "@/features/landing/safety/ledger-list";
import { SettingsDiff } from "@/features/landing/safety/settings-diff";
import { docHref } from "@/shared/lib/routes";
import { Container } from "@/shared/ui/container";
import { TextLink } from "@/shared/ui/link";

export const Safety = (): React.JSX.Element => (
  <section aria-labelledby="safety-title" className="py-24 md:py-32">
    <Container size="wide" className="flex flex-col gap-14">
      <SectionHeader
        id="safety-title"
        eyebrow={SAFETY_COPY.eyebrow}
        title={SAFETY_COPY.title}
        body={SAFETY_COPY.body}
      />
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
        <div className="flex flex-col gap-6 lg:col-span-5">
          <LedgerList />
          <TextLink href={docHref("security")} className="w-fit text-sm">
            Every file and permission, in the security docs
          </TextLink>
        </div>
        <div className="min-w-0 lg:col-span-7">
          <SettingsDiff />
        </div>
      </div>
    </Container>
  </section>
);
