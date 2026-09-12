import { getAdminCategories } from "@/lib/domain/beauty-connect";
import { CategoryForm } from "@/components/admin/category-form";
import { CategoryToggle } from "@/components/admin/admin-actions";
import { CategoryImageEditor } from "@/components/admin/category-image-editor";
import { SectionHeading, SetupState } from "@/components/shared/ui";
import { env } from "@/config/env";
import { publicImageUrl } from "@/lib/utils";

export default async function AdminCategoriesPage() {
  try {
    const categories = await getAdminCategories();
    return (
      <div>
        <SectionHeading
          eyebrow="Configuration"
          title="Specialities"
          description="Maintain one shared speciality list for worker onboarding."
        />
        <div className="mt-8">
          <CategoryForm />
        </div>
        <div className="mt-5 grid gap-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="grid gap-4 border border-border bg-background p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
            >
              <div className="flex min-w-0 flex-wrap items-start gap-4">
                <CategoryImageEditor
                  categoryId={category.id}
                  categoryName={category.name}
                  imagePath={category.image_path}
                  imageUrl={publicImageUrl(
                    env.supabase.url,
                    "speciality-images",
                    category.image_path,
                  )}
                />
                <div className="min-w-[10rem] pt-1">
                  <h2 className="font-semibold">{category.name}</h2>
                </div>
              </div>
              <CategoryToggle
                categoryId={category.id}
                active={category.is_active}
              />
            </div>
          ))}
        </div>
      </div>
    );
  } catch {
    return <SetupState />;
  }
}
