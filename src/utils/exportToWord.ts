import { Document, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, Packer } from 'docx';
import { saveAs } from 'file-saver';

interface ModelApplication {
  id: string;
  telegram_user_id: number;
  telegram_username: string | null;
  full_name: string | null;
  age: number | null;
  country: string | null;
  height: string | null;
  weight: string | null;
  body_params?: string | null;
  hair_color: string | null;
  language_skills?: string | null;
  platforms: string[] | null;
  content_preferences: string[] | null;
  social_media_experience?: string[] | null;
  social_media_links?: string | null;
  equipment?: string | null;
  time_availability?: string | null;
  desired_income: string | null;
  strong_points?: string | null;
  about_yourself: string | null;
  status: string;
  created_at: string;
  completed_at: string | null;
}

const statusLabels: Record<string, string> = {
  'pending': '⏳ На рассмотрении',
  'approved': '✅ Одобрена',
  'rejected': '❌ Отклонена',
  'in_progress': '📝 В процессе заполнения'
};

export const exportApplicationToWord = async (application: ModelApplication) => {
  const rows: { label: string; value: string }[] = [
    { label: 'Telegram', value: `@${application.telegram_username || 'не указан'}` },
    { label: 'Полное имя', value: application.full_name || 'Не указано' },
    { label: 'Возраст', value: application.age?.toString() || 'Не указан' },
    { label: 'Страна', value: application.country || 'Не указана' },
    { label: 'Рост', value: application.height || 'Не указан' },
    { label: 'Вес', value: application.weight || 'Не указан' },
    { label: 'Параметры фигуры', value: application.body_params || 'Не указаны' },
    { label: 'Цвет волос', value: application.hair_color || 'Не указан' },
    { label: 'Языки', value: application.language_skills || 'Не указаны' },
    { label: 'Платформы', value: (application.platforms || []).join(', ') || 'Не указаны' },
    { label: 'Типы контента', value: (application.content_preferences || []).join(', ') || 'Не указаны' },
    { label: 'Опыт в соцсетях', value: (application.social_media_experience || []).join(', ') || 'Не указан' },
    { label: 'Ссылки на соцсети', value: application.social_media_links || 'Не указаны' },
    { label: 'Оборудование', value: application.equipment || 'Не указано' },
    { label: 'Доступное время', value: application.time_availability || 'Не указано' },
    { label: 'Желаемый доход', value: application.desired_income || 'Не указан' },
    { label: 'Сильные стороны', value: application.strong_points || 'Не указаны' },
    { label: 'Статус', value: statusLabels[application.status] || application.status },
    { label: 'Дата заявки', value: new Date(application.created_at).toLocaleDateString('ru-RU', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })},
  ];

  const tableRows = rows.map(row => 
    new TableRow({
      children: [
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          children: [new Paragraph({
            children: [new TextRun({ text: row.label, bold: true, size: 22 })]
          })],
          shading: { fill: "f0f0f0" }
        }),
        new TableCell({
          width: { size: 70, type: WidthType.PERCENTAGE },
          children: [new Paragraph({
            children: [new TextRun({ text: row.value, size: 22 })]
          })]
        })
      ]
    })
  );

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: "APOLLO PRODUCTION",
          heading: HeadingLevel.TITLE,
          alignment: "center"
        }),
        new Paragraph({
          text: "Заявка модели",
          heading: HeadingLevel.HEADING_1,
          alignment: "center"
        }),
        new Paragraph({ text: "" }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: tableRows
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          text: "О себе",
          heading: HeadingLevel.HEADING_2
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: application.about_yourself || 'Информация не предоставлена',
              size: 22
            })
          ],
          border: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
            left: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
            right: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" }
          }
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          text: `Документ сформирован: ${new Date().toLocaleDateString('ru-RU', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}`,
          alignment: "right"
        })
      ]
    }]
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `Заявка_${application.full_name?.replace(/\s+/g, '_') || application.telegram_username || application.id}_${new Date().toISOString().split('T')[0]}.docx`;
  saveAs(blob, fileName);
};
