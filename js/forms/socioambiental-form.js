export const SocioambientalFormSchema = {
    id: 'socioambiental_v2',
    title: 'Formulário Socioambiental - Seiva Digital V2',
    sections: [
        {
            id: 'metadata',
            title: 'Metadados',
            fields: [
                { id: 'project_name', type: 'text', label: 'Nome do Projeto', required: true, placeholder: 'ex: Projeto Tapajós 2025' },
                { id: 'responsible_name', type: 'text', label: 'Nome do Entrevistador', required: true },
                { id: 'community_name', type: 'text', label: 'Comunidade', required: true }
            ]
        },
        {
            id: 'general',
            title: '📍 1. Dados Gerais da Entrevista',
            fields: [
                { id: 'interview_date', type: 'date', label: 'Data da Entrevista', required: true },
                { id: 'interviewer_name', type: 'text', label: 'Nome do Entrevistador', required: true },
                { id: 'community_name', type: 'text', label: 'Propriedade / Comunidade', required: true },
                { id: 'responsible_name', type: 'text', label: 'Responsável pela Propriedade', required: true },
                { id: 'location_gps', type: 'gps', label: 'Coordenadas GPS', required: true },
                { id: 'photo_interviewee', type: 'photo', label: 'Foto do Entrevistado/Local', required: true }
            ]
        },
        {
            id: 'demographics',
            title: '👥 2. Caracterização Sócio-Demográfica',
            fields: [
                { id: 'residents_count', type: 'number', label: 'Quantas pessoas moram na propriedade?', required: true },
                {
                    id: 'age_groups',
                    type: 'multicheckbox',
                    label: 'Faixas etárias presentes',
                    options: ['Crianças (0-14)', 'Jovens (15-29)', 'Adultos (30-59)', 'Idosos (60+)']
                },
                { id: 'residence_time', type: 'number', label: 'Tempo de residência na área (anos)' },
                {
                    id: 'origin',
                    type: 'select',
                    label: 'Origem da família',
                    required: true,
                    options: ['Nascido aqui', 'Mesmo município', 'Mesmo estado', 'Outro estado', 'Exterior']
                },
                {
                    id: 'identity_self_declaration',
                    type: 'select',
                    label: 'Autodeclaração (Identidade Étnica/Tradicional)',
                    required: true,
                    options: ['Indígena', 'Quilombola', 'Ribeirinha', 'Agricultor Familiar', 'Assentado', 'Outro']
                },
                {
                    id: 'identity_other',
                    type: 'text',
                    label: 'Qual outra identidade?',
                    condition: { field: 'identity_self_declaration', equals: 'Outro' }
                },
                { id: 'photo_family', type: 'photo', label: 'Foto da residência/família' }
            ]
        },
        {
            id: 'economy',
            title: '💼 3. Uso do Território e Atividades Produtivas',
            fields: [
                {
                    id: 'income_sources',
                    type: 'multicheckbox',
                    label: 'Principais fontes de renda',
                    required: true,
                    options: [
                        'Agricultura familiar',
                        'Pecuária extensiva',
                        'Extrativismo vegetal',
                        'Criação de animais',
                        'Benefícios sociais',
                        'Assalariado rural',
                        'Outros'
                    ]
                },
                {
                    id: 'agriculture_details',
                    type: 'text',
                    label: 'Quais culturas agrícolas?',
                    condition: { field: 'income_sources', contains: 'Agricultura familiar' }
                },
                {
                    id: 'extractivism_details',
                    type: 'text',
                    label: 'Quais produtos extrativistas?',
                    condition: { field: 'income_sources', contains: 'Extrativismo vegetal' }
                },
                {
                    id: 'forest_products_use',
                    type: 'multicheckbox',
                    label: 'Uso de produtos florestais (Consumo/Venda)',
                    options: [
                        'Lenha para cozinhar/forno',
                        'Madeira para construção/cercas',
                        'Frutos comestíveis',
                        'Plantas medicinais',
                        'Resina/goma/mel',
                        'Caça/Pesca para subsistência'
                    ]
                },
                { id: 'photo_activity', type: 'photo', label: 'Foto da atividade produtiva principal', required: true }
            ]
        },
        {
            id: 'infrastructure',
            title: '🏡 4. Infraestrutura e Acesso a Políticas Públicas',
            fields: [
                {
                    id: 'has_electricity',
                    type: 'radio',
                    label: 'Possui Energia Elétrica?',
                    required: true,
                    options: [{ label: 'Sim', value: 'yes' }, { label: 'Não', value: 'no' }]
                },
                {
                    id: 'has_water',
                    type: 'radio',
                    label: 'Possui Água Encanada?',
                    required: true,
                    options: [{ label: 'Sim', value: 'yes' }, { label: 'Não', value: 'no' }]
                },
                {
                    id: 'has_school',
                    type: 'radio',
                    label: 'Escola próxima acessível?',
                    required: true,
                    options: [{ label: 'Sim', value: 'yes' }, { label: 'Não', value: 'no' }]
                },
                {
                    id: 'school_distance',
                    type: 'number',
                    label: 'Distância da escola (km)',
                    condition: { field: 'has_school', equals: 'yes' }
                },
                {
                    id: 'has_health_post',
                    type: 'radio',
                    label: 'Posto de Saúde acessível?',
                    required: true,
                    options: [{ label: 'Sim', value: 'yes' }, { label: 'Não', value: 'no' }]
                }
            ]
        },
        {
            id: 'ecology_conflicts',
            title: '🌳 5. Dinâmica Ecológica e Pressões Territoriais',
            fields: [
                {
                    id: 'forest_situation',
                    type: 'select',
                    label: 'Situação da floresta local nos últimos 10 anos',
                    required: true,
                    options: ['Crescente', 'Diminuindo', 'Estável', 'Não sei']
                },
                {
                    id: 'perceived_threats',
                    type: 'multicheckbox',
                    label: 'Principais ameaças/pressões percebidas',
                    required: true,
                    options: [
                        'Desmatamento agricultura',
                        'Pecuária extensiva',
                        'Incêndios florestais',
                        'Caça/Pesca ilegal (invasores)',
                        'Extração ilegal de madeira',
                        'Grilagem/Invasão de terra',
                        'Grandes obras (estradas/barragens)',
                        'Contaminação por agrotóxicos/mineração'
                    ]
                },
                {
                    id: 'conflict_details',
                    type: 'textarea',
                    label: 'Descrição detalhada dos conflitos (se houver)',
                    condition: { field: 'perceived_threats', contains: 'Grilagem/Invasão de terra' }
                },
                {
                    id: 'climate_changes',
                    type: 'multicheckbox',
                    label: 'Mudanças climáticas percebidas',
                    options: ['Chuvas irregulares', 'Secas mais longas', 'Rios com menos água', 'Frutos fora de época', 'Não percebo mudanças']
                },
                { id: 'photo_environment', type: 'photo', label: 'Foto da área de entorno/impacto', required: true }
            ]
        },
        {
            id: 'social_org',
            title: '🛡️ 6. Organização Social e Saberes',
            fields: [
                {
                    id: 'participates_association',
                    type: 'radio',
                    label: 'Participa de associação comunitária?',
                    options: [{ label: 'Sim', value: 'yes' }, { label: 'Não', value: 'no' }]
                },
                {
                    id: 'association_name',
                    type: 'text',
                    label: 'Qual associação?',
                    condition: { field: 'participates_association', equals: 'yes' }
                },
                {
                    id: 'interest_training',
                    type: 'radio',
                    label: 'Interesse em capacitação técnica?',
                    options: [{ label: 'Sim', value: 'yes' }, { label: 'Não', value: 'no' }]
                },
                {
                    id: 'conservation_concern',
                    type: 'slider',
                    label: 'Nível de preocupação com a conservação da floresta (1-5)',
                    min: 1, max: 5, step: 1
                }
            ]
        },
        {
            id: 'validation',
            title: '📋 7. Observações e Validação',
            fields: [
                { id: 'interviewer_notes', type: 'textarea', label: 'Observações do Técnico/Antropólogo' },
                { id: 'validation_status', type: 'select', label: 'Status da Entrevista', required: true, options: ['Concluído', 'Pendente', 'Rejeitado'] },
                { id: 'signature', type: 'signature', label: 'Assinatura Digital (Entrevistado/Técnico)', required: true },
                { id: 'final_gps', type: 'gps', label: 'Posição Final GPS (Validação)', required: true }
            ]
        }
    ]
};
